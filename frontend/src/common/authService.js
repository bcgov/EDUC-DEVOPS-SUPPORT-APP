import axios from 'axios';
import {BACKEND_ROUTES} from "../constants/routes";

export default {
  //Refreshes the users auth token
  async refreshAuthToken() {
    try {
      const response = await axios.post(BACKEND_ROUTES.REFRESH);

      if(response.data.error){
        return {error: response.data.error_description};
      }
      
      return response.data;
    } catch (e) {
      console.log(`Failed to refresh JWT token - ${e}`); // eslint-disable-line no-console
      throw e;
    }
  }
};
