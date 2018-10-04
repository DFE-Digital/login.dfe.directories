const invitationStorage = require('./../src/app/invitations/data/redisInvitationStorage');

const analyseAttributes = (object, counters) => {
  const attributes = Object.keys(object);

  attributes.forEach((attribute) => {
    let counter = counters.find(x => x.name === attribute);
    if (!counter) {
      counter = {
        name: attribute,
        timesUsed: 0,
      };
      counters.push(counter);
    }

    counter.timesUsed += 1;

    const value = object[attribute];
    if (value instanceof Object) {
      counter.attributeUsage = counter.attributeUsage || [];
      analyseAttributes(value, counter.attributeUsage);
    }
  });
};

console.info('Getting all invitations');
invitationStorage.list(1, 99999).then((invitations) => {
  const analysis = {
    numberOfInvitations: invitations.invitations.length,
    attributeUsage: [],
    ktsInvitationsNotAccepted: 0,
    oldCredentialSources: [],
  };

  for (let i = 0; i < invitations.invitations.length; i++) {
    const invitation = invitations.invitations[i];

    analyseAttributes(invitation, analysis.attributeUsage);

    if (invitation.oldCredentials && !invitation.isCompleted) {
      analysis.ktsInvitationsNotAccepted += 1;
    }

    if (invitation.oldCredentials && invitation.oldCredentials.source && !analysis.oldCredentialSources.find(x => x === invitation.oldCredentials.source)) {
      analysis.oldCredentialSources.push(invitation.oldCredentials.source);
    }
  }

  console.info(JSON.stringify(analysis, undefined, 4));
}).catch((e) => {
  console.error(e.stack);
});
