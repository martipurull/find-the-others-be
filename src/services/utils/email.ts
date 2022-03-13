import sgMail from '@sendgrid/mail'
import { IBand, IGig, IInvitee, IProject, IUser } from '../../types'
import striptags from 'striptags'
import createHttpError from 'http-errors'
import UserModel from '../user/schema'

process.env.TS_NODE_DEV && require('dotenv').config()

sgMail.setApiKey(process.env.SENDGRID_KEY!)

//invite to join platform

export const sendInvite = async (sender: IUser, recipient: IInvitee, invitationText: string) => {
    const invite = {
        to: sender.email,
        from: recipient.email,
        subject: `You're invited: ${sender.firstName} think you should find-the-others!`,
        text: striptags(invitationText),
        html: invitationText
    }
    await sgMail.send(invite)
}

//gig offers

export const sendGigConfirmation = async (sender: IUser, recipient: IUser, gig: IGig, project: IProject) => {
    const confirmation = {
        to: sender.email,
        from: recipient.email,
        subject: `You got the gig!`,
        text: striptags(`${sender.firstName} has accepted your application to play ${gig.instrument} on their project '${project.title}'`),
        html: `${sender.firstName} has accepted your application to play ${gig.instrument} on their project '${project.title}'`
    }
    await sgMail.send(confirmation)
}

export const sendGigRejection = async (sender: IUser, recipient: IUser, gig: IGig, project: IProject) => {
    const rejection = {
        to: sender.email,
        from: recipient.email,
        subject: `Better luck next time!`,
        text: striptags(`Unfortunately, your application to play ${gig.instrument} on '${project.title}' hasn't been successful.`),
        html: `Unfortunately, your application to play ${gig.instrument} on '${project.title}' hasn't been successful.`
    }
    await sgMail.send(rejection)
}

export const sendGigRejections = async (sender: IUser, rejectedIds: string[], gig: IGig, project: IProject) => {
    let contactedRejects = []
    let unableToContactRejects = []
    for (let i = 0; i < rejectedIds.length; i++) {
        const rejectedApplicant = await UserModel.findById(rejectedIds[i])
        if (!rejectedApplicant) {
            unableToContactRejects.push(rejectedApplicant)
        } else {
            const rejection = {
                to: sender.email,
                from: rejectedApplicant.email,
                subject: `Better luck next time!`,
                text: striptags(`Unfortunately, your application to play ${gig.instrument} on '${project.title}' hasn't been successful.`),
                html: `Unfortunately, your application to play ${gig.instrument} on '${project.title}' hasn't been successful.`
            }
            await sgMail.send(rejection)
            contactedRejects.push(rejectedApplicant)
        }
    }
    return { contactedRejects, unableToContactRejects }
}

//band invites

export const sendBandInvite = async (sender: IUser, recipient: IUser, band: IBand) => {
    const invite = {
        to: sender.email,
        from: recipient.email,
        subject: `${band.name} would like you to join them.`,
        text: `${sender.firstName} ${sender.lastName} thinks you should be in ${band.name} too.`
    }
    await sgMail.send(invite)
}

export const withdrawBandInvite = async (sender: IUser, recipient: IUser, band: IBand) => {
    const withdrawal = {
        to: sender.email,
        from: recipient.email,
        subject: `${band.name} have withdrawn their invitation.`,
        text: `${sender.firstName} ${sender.lastName} has withdrawn the invitation for you to join ${band.name}.`
    }
    await sgMail.send(withdrawal)
}

export const notifyBandMembers = async (sender: IUser, recipients: IUser[], band: IBand, text: string) => {
    for (const recipient of recipients) {
        const message = {
            to: sender.email,
            from: recipient.email,
            subject: `${sender.firstName} ${sender.lastName} has responded to your invitation.`,
            text
        }
        await sgMail.send(message)
    }
}