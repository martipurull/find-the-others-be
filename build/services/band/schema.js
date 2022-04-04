"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const { Schema, model } = mongoose_1.default;
const Track = new Schema({
    trackName: String,
    track: {
        audiofile: String,
        filename: String
    },
    cover: {
        image: String,
        filename: String
    }
});
const BandModel = new Schema({
    name: { type: String, required: true },
    bandAdmins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    invitationsSent: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    readyTracks: [Track],
    releasedTracks: [Track],
    projects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    blurb: { type: String, required: true },
    bio: { type: String, required: true },
    avatar: String,
    filename: String,
    followedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true, toJSON: { virtuals: true } });
BandModel.virtual('noOfFollowers').get(function () { return this.followedBy.length; });
exports.default = model('Band', BandModel);
