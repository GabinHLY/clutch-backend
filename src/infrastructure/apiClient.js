import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'https://api.pandascore.co/';
const API_KEY = process.env.PANDASCORE_API_KEY;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        Authorization: `Bearer ${API_KEY}`,
    },
});

export default apiClient;
