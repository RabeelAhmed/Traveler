import axios from 'axios';

const agentClient = axios.create({
  baseURL: import.meta.env.VITE_AGENT_BASE_URL,
  withCredentials: true,
});

export default agentClient;
