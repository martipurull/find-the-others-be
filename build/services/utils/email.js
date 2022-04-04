"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyRemovedMember = exports.notifyBandMembers = exports.withdrawBandInvite = exports.sendBandInvite = exports.sendGigRejections = exports.sendGigRejection = exports.sendGigConfirmation = exports.sendInvite = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const striptags_1 = __importDefault(require("striptags"));
const schema_1 = __importDefault(require("../user/schema"));
process.env.TS_NODE_DEV && require('dotenv').config();
const { SENDER_EMAIL } = process.env;
mail_1.default.setApiKey(process.env.SENDGRID_KEY);
//invite to join platform
const sendInvite = (sender, recipient, invitationText) => __awaiter(void 0, void 0, void 0, function* () {
    const invite = {
        to: recipient.email,
        from: SENDER_EMAIL,
        subject: `You're invited: ${sender.firstName} think you should find-the-others!`,
        text: (0, striptags_1.default)(invitationText),
        html: invitationText
    };
    yield mail_1.default.send(invite);
});
exports.sendInvite = sendInvite;
//gig offers
const sendGigConfirmation = (sender, recipient, gig, project) => __awaiter(void 0, void 0, void 0, function* () {
    const confirmation = {
        to: recipient.email,
        from: SENDER_EMAIL,
        subject: `You got the gig!`,
        text: (0, striptags_1.default)(`${sender.firstName} has accepted your application to play ${gig.instrument} on their project '${project.title}'`),
        html: `${sender.firstName} has accepted your application to play ${gig.instrument} on their project '${project.title}'`
    };
    yield mail_1.default.send(confirmation);
});
exports.sendGigConfirmation = sendGigConfirmation;
const sendGigRejection = (sender, recipient, gig, project) => __awaiter(void 0, void 0, void 0, function* () {
    const rejection = {
        to: recipient.email,
        from: SENDER_EMAIL,
        subject: `Better luck next time!`,
        text: (0, striptags_1.default)(`Unfortunately, your application to play ${gig.instrument} on '${project.title}' hasn't been successful.`),
        html: `Unfortunately, your application to play ${gig.instrument} on '${project.title}' hasn't been successful.`
    };
    yield mail_1.default.send(rejection);
});
exports.sendGigRejection = sendGigRejection;
const sendGigRejections = (sender, rejectedIds, gig, project) => __awaiter(void 0, void 0, void 0, function* () {
    let contactedRejects = [];
    let unableToContactRejects = [];
    for (let i = 0; i < rejectedIds.length; i++) {
        const rejectedApplicant = yield schema_1.default.findById(rejectedIds[i]);
        if (!rejectedApplicant) {
            unableToContactRejects.push(rejectedApplicant);
        }
        else {
            const rejection = {
                to: rejectedApplicant.email,
                from: SENDER_EMAIL,
                subject: `Better luck next time!`,
                text: (0, striptags_1.default)(`Unfortunately, your application to play ${gig.instrument} on '${project.title}' hasn't been successful.`),
                html: `Unfortunately, your application to play ${gig.instrument} on '${project.title}' hasn't been successful.`
            };
            yield mail_1.default.send(rejection);
            contactedRejects.push(rejectedApplicant);
        }
    }
    return { contactedRejects, unableToContactRejects };
});
exports.sendGigRejections = sendGigRejections;
//band invites
const sendBandInvite = (sender, recipient, band) => __awaiter(void 0, void 0, void 0, function* () {
    const invite = {
        to: recipient.email,
        from: SENDER_EMAIL,
        subject: `${band.name} would like you to join them.`,
        text: `${sender.firstName} ${sender.lastName} thinks you should be in ${band.name} too.`
    };
    yield mail_1.default.send(invite);
});
exports.sendBandInvite = sendBandInvite;
const withdrawBandInvite = (sender, recipient, band) => __awaiter(void 0, void 0, void 0, function* () {
    const withdrawal = {
        to: recipient.email,
        from: SENDER_EMAIL,
        subject: `${band.name} have withdrawn their invitation.`,
        text: `${sender.firstName} ${sender.lastName} has withdrawn the invitation for you to join ${band.name}.`
    };
    yield mail_1.default.send(withdrawal);
});
exports.withdrawBandInvite = withdrawBandInvite;
const notifyBandMembers = (sender, recipients, band, text) => __awaiter(void 0, void 0, void 0, function* () {
    for (const recipient of recipients) {
        const message = {
            to: recipient.email,
            from: SENDER_EMAIL,
            subject: `${sender.firstName} ${sender.lastName} has responded to your invitation.`,
            text
        };
        yield mail_1.default.send(message);
    }
});
exports.notifyBandMembers = notifyBandMembers;
const notifyRemovedMember = (sender, recipient, band) => __awaiter(void 0, void 0, void 0, function* () {
    const removalNotification = {
        to: recipient.email,
        from: SENDER_EMAIL,
        subject: `You have left ${band.name}.`,
        text: `${sender.firstName} ${sender.lastName} has removed you as a member of ${band.name}.`
    };
    yield mail_1.default.send(removalNotification);
});
exports.notifyRemovedMember = notifyRemovedMember;
