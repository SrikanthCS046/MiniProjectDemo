const Joi=require("joi");
module.exports=Joi.object({
  email:Joi.string().required(),
  pass:Joi.string().required()
});