import sgMail from '@sendgrid/mail'
import { IInvitee, IUser } from '../../types'
import striptags from 'striptags'

process.env.TS_NODE_DEV && require('dotenv').config()

sgMail.setApiKey(process.env.SENDGRID_KEY!)

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