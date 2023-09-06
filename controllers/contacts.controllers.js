const Joi = require("joi");

const services = require("../models/contacts");

const validateSchemaPost = Joi.object({
  name: Joi.string().trim().min(2).max(30).required(),
  email: Joi.string().email({ tlds: true }).required(),
  phone: Joi.string().required(),
  favorite: Joi.boolean(),
});

const validateSchemaPut = Joi.object({
  name: Joi.string().trim().min(2).max(30),
  email: Joi.string().email({ tlds: true }),
  phone: Joi.string(),
  favorite: Joi.boolean(),
});

const validateSchemaPatch = Joi.object({
  favorite: Joi.boolean().required(),
});

const listContacts = async (req, res, next) => {
  try {
    const { query } = req;
    const contacts = await services.listContacts(query);
    res.json({
      status: 200,
      data: {
        result: contacts,
      },
    });
  } catch (err) {
    console.log(`"Error description:", ${err.message}`);
    next(err);
  }
};

const getContactById = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const data = await services.getContactById(contactId);
    if (data) {
      res.json({
        status: 200,
        data: {
          contact: data,
        },
      });
    } else {
      res.status(404).json({
        status: "fail",
        code: 404,
        message: `Not found id: ${contactId}`,
      });
    }
  } catch (err) {
    console.log(`"Error:", ${err.message}`);
    next(err);
  }
};

const removeContact = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const isIdInDatabase = await services.removeContact(contactId);
    if (isIdInDatabase) {
      return res.status(200).json({ status: 200, message: "contact deleted" });
    } else {
      return res.status(404).json({
        message: `There is no contact with id ${contactId} in database`,
      });
    }
  } catch (err) {
    console.error(err);
    next(err);
  }
};

const addContact = async (req, res, next) => {
  try {
    const body = validateSchemaPost.validate(req.body);
    if (body.error?.message) {
      return res.status(400).json({ message: body.error.message });
    }
    const newContact = await services.addContact(req.body);
    return res.status(201).json({ data: { newContact } });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

const updateContact = async (req, res, next) => {
  try {
    const { error } = validateSchemaPut.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { contactId } = req.params;
    const body = req.body;

    if (!body.name && !body.email && !body.phone) {
      return res.status(400).json({ message: "missing fields" });
    }
    const updatedContact = await services.updateContact(contactId, req.body);
    if (updatedContact) {
      return res.status(200).json({ status: 200, data: updatedContact });
    } else {
      return res.status(404).json({
        status: 404,
        message: `There is no contact with id <${contactId}> in database`,
      });
    }
  } catch (err) {
    console.log(`Error updating the contact}`, err.message);
    //  return false;
    next(err);
  }
};

const updateStatusContact = async (req, res, next) => {
  try {
    const { error } = validateSchemaPatch.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });
    const { favorite } = req.body;
    const { contactId } = req.params;

    if (!!favorite === undefined || null) {
      return res.status(400).json({ message: "missing field favorite" });
    }
    const updatedStatusContact = await services.updateStatusContact(
      contactId,
      favorite
    );
    if (updatedStatusContact) {
      return res.status(200).json({ status: 200, data: updatedStatusContact });
    } else {
      return res.status(404).json({
        status: 404,
        message: `There is no contact with id <${contactId}> in database`,
      });
    }
  } catch (err) {
    console.log(`Error updating the contact`, err.message);
    //  return false;
    next(err);
  }
};

module.exports = {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  updateStatusContact,
};
