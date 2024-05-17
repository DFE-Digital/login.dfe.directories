'use strict';

const config = require('./../../../infrastructure/config');
const logger = require('./../../../infrastructure/logger');
const { getUserInvitation, updateInvitation } = require('./../data');
const userStorage = require('./../../user/adapter');
const { safeUser } = require('./../../../utils');
// const NotificationClient = require('login.dfe.notifications.client');
const PublicApiClient = require('login.dfe.public-api.jobs.client');
const ServiceNotificationsClient = require('login.dfe.service-notifications.jobs.client');
const NotificationClient = require('login.dfe.notifications.client');
const {createEntraIdUserAccount} = require('./../../../infrastructure/entraId/index');
const { generateEntraIdOtp } = require('../../../app/invitations/utils/index');

const createUser = async (req, res) => {

  //create a dsi user 
  // password body will be undefined - it will generate a placeholder password
  try {
    const invId = req.params.id;
    const password = req.body?.password || generateEntraIdOtp();

    if (!invId) {
      return res.status(400).send();
    }

    if (!password) {
      return res.status(400).send();
    }

    const invitation = await getUserInvitation(req.params.id, req.header('x-correlation-id'));
    if (!invitation) {
      return res.status(404).send();
    }

    // If no password is provided in the body, it implies that user is attempting to create an account in Entra
    // and not just a standard DSI account.
  
    let entraIdUserAccount;
    let entraIdOtp;
    if(!req.body.password){
    //create entra id account
    
    const requestedEntraIdAccount = {
      displayName: `${invitation.firstName} ${invitation.lastName}`,
      givenName: invitation.firstName,
      surname: invitation.lastName,
      identities:[{
        signInType: 'emailAddress',
        issuer: 'devDSIPoC.onmicrosoft.com',
        issuerAssignedId: invitation.email}],
      mail: invitation.email,
      passwordProfile:{
        forceChangePasswordNextSignIn:true, 
        // forceChangePasswordNextSignInWithMfa:true,
        password:generateEntraIdOtp(),
      }
    }
    //OTP password to be sent in the email to activate the Entra account
     entraIdOtp = requestedEntraIdAccount.passwordProfile.password
    //  console.log(entraIdOtp)
  
    //create entraID account 
     entraIdUserAccount = await createEntraIdUserAccount(requestedEntraIdAccount)
  }
    const user = await userStorage.create(invitation.email, password, invitation.firstName, invitation.lastName, null, null, req.header('x-correlation-id'), invitation.isMigrated,entraIdUserAccount.id );

    const completedInvitation = Object.assign(invitation, { isCompleted: true, userId: user.id });
    await updateInvitation(completedInvitation);

    const serviceNotificationsClient = new ServiceNotificationsClient({
      connectionString: config.notifications.connectionString,
    });
    await serviceNotificationsClient.notifyUserUpdated(safeUser(user));

    //send OTP EMAIL 
    const servicesUrl = config.hostingEnvironment.servicesUrl || 'https://tran-services.signin.education.gov.uk/';
    const notificationClient = new NotificationClient({
      connectionString: config.notifications.connectionString,
    });
    notificationClient.sendEntraIdOTP(user.email, user.given_name, user.family_name,entraIdOtp, servicesUrl); 

    const publicApiClient = new PublicApiClient({
      connectionString: config.notifications.connectionString,
    });
    await publicApiClient.sendInvitationComplete(user.id, invitation.callbacks);

    return res.status(201).send({...safeUser(user), entraIdUserAccount: entraIdUserAccount});
  } catch (e) {
    logger.error(e);
    res.status(500).send(e.message);
  }
};

module.exports = createUser;
