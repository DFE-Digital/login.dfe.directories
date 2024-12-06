const express = require("express");
const apiAuth = require("login.dfe.api.auth");
const config = require("./../../../infrastructure/config");
const { asyncWrapper } = require("login.dfe.express-error-handling");

const listInvitations = require("./listInvitations");
const postInvitations = require("./postInvitations");
const getInvitations = require("./getInvitation");
const getInvitationByEmail = require("./getInvitationByEmail");
const createUser = require("./createUser");
const patchInvitation = require("./patchInvitation");
const postResendInvitation = require("./postResendInvitation");
const assert = require("assert");

const router = express.Router();

const routeExport = () => {
  // Add auth middleware.
  if (config.hostingEnvironment.env !== "dev") {
    router.use("/", apiAuth(router, config));
  }
  assert(
    config.invitations.redisUrl,
    "the invitations.redisUrl config property must be set",
  );

  // Map routed to functions.
  router.get("/", asyncWrapper(listInvitations));
  router.post("/", asyncWrapper(postInvitations));
  router.get("/:id", asyncWrapper(getInvitations));
  router.get("/by-email/:email", asyncWrapper(getInvitationByEmail));
  router.post("/:id/resend", asyncWrapper(postResendInvitation));
  router.patch("/:id", asyncWrapper(patchInvitation));
  router.post("/:id/create_user", asyncWrapper(createUser));
  return router;
};

module.exports = routeExport();
