
import { Context, Callback } from 'aws-lambda';


export async function main( event: any, _context: Context, callback: Callback ) {

  // # this allows us to override claims in the id token
  // # "claimsToAddOrOverride" is the important part
  event.response.claimsOverrideDetails = {
    claimsToAddOrOverride: {
    },
  };

  // # return modified ID token to Amazon Cognito
  return event;

}

