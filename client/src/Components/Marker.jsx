import { Marker } from 'react-leaflet';
import PropTypes from 'prop-types';
const StoryMarkers = ({ story = [], openPopup }) => story.map(video => (
  <Marker key={video._id} position={[video.location.latitude, video.location.longitude]} eventHandlers={{ click: () => openPopup(video) }} />
));
StoryMarkers.propTypes = { story: PropTypes.array, openPopup: PropTypes.func.isRequired };
export default StoryMarkers;
