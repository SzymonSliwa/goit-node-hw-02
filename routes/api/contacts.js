const express = require("express");

const router = express.Router();

const contactsControllers = require("./../../controllers/contacts.controllers");

router.get("/", contactsControllers.listContacts);

router.get("/:contactId", contactsControllers.getContactById);

router.post("/", contactsControllers.addContact);

router.delete("/:contactId", contactsControllers.removeContact);

router.put("/:contactId", contactsControllers.updateContact);

router.patch("/:contactId/favorite", contactsControllers.updateStatusContact);

module.exports = router;
