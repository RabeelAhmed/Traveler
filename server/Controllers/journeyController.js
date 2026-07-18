const Journey = require("../Models/journey");
const Post = require("../Models/post");
const User = require("../Models/User");
const mongoose = require("mongoose");
const { success, error } = require("../Utils/responseWrapper");
const { mapPostOutput } = require("../Utils/utils");
const Notification = require('../Models/notification');
const { notify, broadcastNewPost } = require('../socket');

const startJourney = async (req, res) => {
  try {
    const { title, description, location, media, rating, hashtags } = req.body;

    if (!title || !description || !location || !media) {
      return res.send(error(400, "All fields (title, description, location, media) are required to start a journey"));
    }

    const curUserId = req.user.user_Id;
    const author = await User.findById(curUserId);
    if (!author) {
      return res.send(error(404, "User not found"));
    }

    const parsedMedia = typeof media === "string" ? JSON.parse(media) : (media || []);
    const parsedHashtags = typeof hashtags === "string" ? JSON.parse(hashtags) : (hashtags || []);

    const journeyId = new mongoose.Types.ObjectId();

    // 1. Create first Post (Step 0)
    const newPost = await Post.create({
      userId: curUserId,
      title,
      description,
      location,
      rating: rating || 5, // Rating is conditionally required, default to 5 if not provided
      media: parsedMedia,
      hashtags: parsedHashtags,
      journeyId,
      stepIndex: 0,
    });

    // 2. Create the Journey
    const newJourney = await Journey.create({
      _id: journeyId,
      owner: curUserId,
      title,
      steps: [newPost._id],
      isActive: true,
      startedAt: new Date(),
    });

    // 3. Add Post to User's posts
    author.posts.push(newPost._id);
    await author.save();

    // Notify all followers that a new journey has started
    if (author.followers?.length > 0) {
      const populated = await Post.findById(newPost._id)
        .populate('userId')
        .populate({ path: 'comments', populate: { path: 'userId', select: 'fullname profilePicture' } });
      const mappedPost = mapPostOutput(populated, curUserId);
      // Real-time feed broadcast
      broadcastNewPost(author.followers, mappedPost);
      // Socket notifications
      for (const followerId of author.followers) {
        const notif = await Notification.create({
          recipient: followerId,
          sender: curUserId,
          type: 'journey_start',
          post: newPost._id,
          journey: newJourney._id,
        });
        notify(notif);
      }
    }

    return res.send(
      success(201, {
        journey: newJourney,
        post: mapPostOutput(newPost, curUserId),
        message: "Journey started successfully",
      })
    );
  } catch (err) {
    console.error("StartJourney Error:", err);
    return res.send(error(500, "Something went wrong starting the journey"));
  }
};

const addStep = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, location, media, rating, hashtags } = req.body;

    if (!description || !location || !media) {
      return res.send(error(400, "All fields (description, location, media) are required to add a step"));
    }

    const curUserId = req.user.user_Id;
    const journey = await Journey.findById(id);

    if (!journey) {
      return res.send(error(404, "Journey not found"));
    }

    if (!journey.isActive) {
      return res.send(error(400, "This journey is completed. No more steps can be added."));
    }

    const canContribute =
      journey.owner.toString() === curUserId ||
      journey.collaborators.map((c) => c.toString()).includes(curUserId);
    if (!canContribute) {
      return res.send(error(403, 'Not authorized to add steps to this journey'));
    }

    const author = await User.findById(curUserId);
    if (!author) {
      return res.send(error(404, "User not found"));
    }

    const parsedMedia = typeof media === "string" ? JSON.parse(media) : (media || []);
    const parsedHashtags = typeof hashtags === "string" ? JSON.parse(hashtags) : (hashtags || []);
    const stepIndex = journey.steps.length;

    // Create the Post for this step
    const newPost = await Post.create({
      userId: curUserId,
      title: `${journey.title} - Stop ${stepIndex + 1}`,
      description,
      location,
      rating: rating || 5,
      media: parsedMedia,
      hashtags: parsedHashtags,
      journeyId: journey._id,
      stepIndex,
    });

    // Push step post to journey
    journey.steps.push(newPost._id);
    await journey.save();

    // Push post to user posts
    author.posts.push(newPost._id);
    await author.save();

    // Notify all followers of the journey owner + broadcast to their feeds
    const owner = await User.findById(journey.owner).select('followers');
    if (owner && owner.followers?.length > 0) {
      const populated = await Post.findById(newPost._id)
        .populate('userId')
        .populate({ path: 'comments', populate: { path: 'userId', select: 'fullname profilePicture' } });
      const mappedPost = mapPostOutput(populated, curUserId);
      broadcastNewPost(owner.followers, mappedPost);
      for (const followerId of owner.followers) {
        const notif = await Notification.create({
          recipient: followerId,
          sender: journey.owner,
          type: 'journey_step',
          post: newPost._id,
          journey: journey._id,
        });
        notify(notif);
      }
    }

    return res.send(
      success(201, {
        post: mapPostOutput(newPost, curUserId),
        message: "Step added successfully",
      })
    );
  } catch (err) {
    console.error("AddStep Error:", err);
    return res.send(error(500, "Something went wrong adding step"));
  }
};

const endJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const curUserId = req.user.user_Id;
    const journey = await Journey.findById(id);

    if (!journey) {
      return res.send(error(404, "Journey not found"));
    }

    if (journey.owner.toString() !== curUserId) {
      return res.send(error(403, "Only the owner can complete this journey"));
    }

    journey.isActive = false;
    journey.endedAt = new Date();
    await journey.save();

    // Notify all followers of the journey owner
    const owner = await User.findById(journey.owner).select('followers');
    if (owner && owner.followers?.length > 0) {
      for (const followerId of owner.followers) {
        const notif = await Notification.create({
          recipient: followerId,
          sender: journey.owner,
          type: 'journey_complete',
          post: null,
          journey: journey._id,
        });
        notify(notif);
      }
    }

    return res.send(
      success(200, {
        journey,
        message: "Journey completed successfully",
      })
    );
  } catch (err) {
    console.error("EndJourney Error:", err);
    return res.send(error(500, "Something went wrong completing the journey"));
  }
};

const getJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const curUserId = req.user?.user_Id;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      query = { slug: id };
    }

    const journey = await Journey.findOne(query)
      .populate("owner", "fullname username profilePicture")
      .populate("collaborators", "fullname username profilePicture")
      .populate("pendingInvites", "fullname username profilePicture")
      .populate({
        path: "steps",
        populate: [
          {
            path: "userId",
          },
          {
            path: "comments",
            populate: {
              path: "userId",
              select: "fullname profilePicture",
            },
          },
        ],
      });

    if (!journey) {
      return res.send(error(404, "Journey not found"));
    }

    // Format steps using mapPostOutput to match feed post structure
    const mappedSteps = journey.steps.map((step) => mapPostOutput(step, curUserId));

    return res.send(
      success(200, {
        journey: {
          _id: journey._id,
          owner: journey.owner,
          title: journey.title,
          isActive: journey.isActive,
          startedAt: journey.startedAt,
          endedAt: journey.endedAt,
          collaborators: journey.collaborators,
          pendingInvites: journey.pendingInvites,
          maxCollaborators: journey.maxCollaborators,
          steps: mappedSteps,
        },
      })
    );
  } catch (err) {
    console.error("GetJourney Error:", err);
    return res.send(error(500, "Something went wrong retrieving journey details"));
  }
};

// POST /journey/:id/invite
const inviteCollaborator = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const curUserId = req.user.user_Id;

    if (!userId) return res.send(error(400, 'userId is required'));

    const journey = await Journey.findById(id);
    if (!journey) return res.send(error(404, 'Journey not found'));
    if (journey.owner.toString() !== curUserId)
      return res.send(error(403, 'Only the owner can invite collaborators'));
    if (!journey.isActive)
      return res.send(error(400, 'Cannot invite to a completed journey'));
    if (journey.collaborators.length >= journey.maxCollaborators)
      return res.send(error(400, `Max collaborators limit (${journey.maxCollaborators}) reached`));
    if (journey.collaborators.map((c) => c.toString()).includes(userId))
      return res.send(error(409, 'User is already a collaborator'));
    if (journey.pendingInvites.map((p) => p.toString()).includes(userId))
      return res.send(error(409, 'Invite already pending for this user'));

    journey.pendingInvites.push(userId);
    await journey.save();

    const notif = await Notification.create({
      recipient: userId,
      sender: curUserId,
      type: 'journey_invite',
      journey: journey._id,
      post: null,
    });
    notify(notif);

    return res.send(success(200, { message: 'Invite sent' }));
  } catch (err) {
    console.error('inviteCollaborator Error:', err);
    return res.send(error(500, 'Something went wrong sending the invite'));
  }
};

// POST /journey/:id/invite/respond
const respondToInvite = async (req, res) => {
  try {
    const { id } = req.params;
    const { accept } = req.body;
    const curUserId = req.user.user_Id;

    const journey = await Journey.findById(id);
    if (!journey) return res.send(error(404, 'Journey not found'));

    const isAlreadyCollab = journey.collaborators.map((c) => c.toString()).includes(curUserId);
    if (isAlreadyCollab) {
      const originalNotif = await Notification.findOne({
        recipient: curUserId,
        journey: journey._id,
        type: 'journey_invite',
      });
      if (originalNotif) {
        originalNotif.inviteStatus = 'accepted';
        await originalNotif.save();
      }
      return res.send(success(200, { accepted: true }));
    }

    const isPending = journey.pendingInvites.map((p) => p.toString()).includes(curUserId);
    if (!isPending) return res.send(error(403, 'No pending invite found for this user'));

    // Remove from pendingInvites regardless
    journey.pendingInvites.pull(curUserId);

    if (accept) {
      journey.collaborators.push(curUserId);
      await journey.save();

      const notif = await Notification.create({
        recipient: journey.owner,
        sender: curUserId,
        type: 'journey_invite_accepted',
        journey: journey._id,
        post: null,
      });
      notify(notif);
    } else {
      await journey.save();
    }

    // Update original notification status so it doesn't show accept/decline buttons anymore
    console.log("Searching for notification with:", {
      recipient: curUserId,
      journey: journey._id,
      type: 'journey_invite'
    });
    const originalNotif = await Notification.findOne({
      recipient: curUserId,
      journey: journey._id,
      type: 'journey_invite',
    });
    console.log("Found notification:", originalNotif);
    if (originalNotif) {
      originalNotif.inviteStatus = accept ? 'accepted' : 'declined';
      const savedNotif = await originalNotif.save();
      console.log("Saved notification update:", savedNotif);
    } else {
      console.log("No matching notification found!");
    }

    return res.send(success(200, { accepted: !!accept }));
  } catch (err) {
    console.error('respondToInvite Error:', err);
    return res.send(error(500, 'Something went wrong responding to the invite'));
  }
};

// DELETE /journey/:id/collaborator/:userId
const removeCollaborator = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const curUserId = req.user.user_Id;

    const journey = await Journey.findById(id);
    if (!journey) return res.send(error(404, 'Journey not found'));
    if (journey.owner.toString() !== curUserId)
      return res.send(error(403, 'Only the owner can remove collaborators'));

    journey.collaborators.pull(userId);
    await journey.save();

    return res.send(success(200, { message: 'Collaborator removed' }));
  } catch (err) {
    console.error('removeCollaborator Error:', err);
    return res.send(error(500, 'Something went wrong removing the collaborator'));
  }
};

// GET /journey/collaborating
const getCollaboratingJourneys = async (req, res) => {
  try {
    const curUserId = req.user.user_Id;
    const journeys = await Journey.find({ collaborators: curUserId })
      .populate('owner', 'fullname username profilePicture')
      .select('title isActive startedAt endedAt steps owner collaborators')
      .sort({ startedAt: -1 });

    return res.send(success(200, { journeys }));
  } catch (err) {
    console.error('getCollaboratingJourneys Error:', err);
    return res.send(error(500, 'Something went wrong fetching collaborating journeys'));
  }
};

module.exports = {
  startJourney,
  addStep,
  endJourney,
  getJourney,
  inviteCollaborator,
  respondToInvite,
  removeCollaborator,
  getCollaboratingJourneys,
};
