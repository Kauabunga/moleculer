/*
 * moleculer
 * Copyright (c) 2018 Ice Services (https://github.com/ice-services/moleculer)
 * MIT Licensed
 */

"use strict";

const Promise = require("bluebird");
const Validator = require("fastest-validator");
const { ValidationError } = require("./errors");
const _ = require("lodash");

class ParamValidator {
	constructor() {
		this.validator = new Validator();
	}

	init(broker) {
		this.broker = broker;
		if (this.broker) {
			broker.use(this.middleware());
		}
	}

	compile(schema) {
		return this.validator.compile(schema);
	}

	getValidationErrorMessage(errors, params, actionName) {
		console.log("getValidationErrorMessage\n\n\n\n\n");
		console.log(errors, params, actionName);
		console.log("getValidationErrorMessage\n\n\n\n\n");
		const errorMessages = (errors || [])
			.map(
				error =>
					`${error.message} Recieved type '${typeof _.result(params, error.field)}' for the '${
						error.field
					}' field!`
			)
			.join(" ");
		const actionMessage = actionName ? `Action name '${actionName}'` : "";
		const message = `Parameters validation error! ${actionMessage} ${errorMessages}`;
		return message.trim();
	}

	validate(params, schema) {
		const res = this.validator.validate(params, schema);
		if (res !== true) throw new ValidationError(this.getValidationErrorMessage(res, params), null, res);

		return true;
	}

	/**
	 * Register validator as a middleware
	 *
	 * @memberOf ParamValidator
	 */
	middleware() {
		return function validatorMiddleware(handler, action) {
			// Wrap a param validator
			if (action.params && typeof action.params === "object") {
				const check = this.compile(action.params);
				const getValidationErrorMessage = (res, params) =>
					this.getValidationErrorMessage(res, params, action.name);
				return function validateContextParams(ctx) {
					const res = check(ctx.params);
					if (res === true) return handler(ctx);
					else
						return Promise.reject(
							new ValidationError(getValidationErrorMessage(res, ctx.params), null, res)
						);
				};
			}
			return handler;
		}.bind(this);
	}
}

module.exports = ParamValidator;
