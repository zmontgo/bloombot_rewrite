import config from '../config';
const reactions = config.channelReacts;
import { PickMessages, Keys } from '../databaseFiles/connect';
import { ObjectId } from 'mongodb';

export class reactionCheckAction {
  static async checkIfCorrect(message) {
    for (var i = 0; i < reactions.length; i++) {
      var obj = reactions[i];
      try {
        if (message.channel.id === obj.channel) {
          obj.reacts.forEach(async (react) => {
            await message.react(react);
          });
        }
      } catch (err) {
        console.log('Error with reaction.' + err);
      }
    }
  }

  static async checkDMReaction(client, user, reaction) {
    if (user.bot) return;

    const pickMessage = await PickMessages.findOne({
      msg: reaction.message.id,
    });

    const channel = await user.createDM();
    const message = await channel.messages.fetch(reaction.message.id);

    if (pickMessage) {
      await PickMessages.deleteOne({
        msg: reaction.message.id,
      });

      if (reaction._emoji.name === '❌') {
        return await message.channel.send(
          ':white_check_mark: Your message has been removed from the database.\nChange your mind? Reach out to a staff member.'
        );
      } else if (reaction._emoji.name === '✅') {
        const amount = await Keys.find({ valid: true }).count();
        const key = await Keys.find({
          valid: true,
        })
          .limit(1)
          .toArray();

        if (amount <= 3) {
          await message.guild.channels.cache
            .get(config.channels.logs)
            .send(
              `⚠️ Steam keys are running out (${amount} left). Add some more soon with \`.addkey\`.`
            );
        }

        if (key.length > 0) {
          try {
            await Keys.updateOne(
              {
                text: key[0].text,
              },
              {
                $set: {
                  valid: false,
                },
              }
            );

            return await message.channel.send(
              `Here is the Steam key to *PLAYNE: The Meditation Game*, enjoy!\n\`${key[0].text}\``
            );
          } catch (err) {
            return await message.channel.send(
              ':x: An error occured. Please reach out to a staff member to receive a key.'
            );
          }
        } else {
          return await message.channel.send(
            `Oops! Looks like I couldn't find a valid key in the database. Don't worry, just reach out to a staff member!`
          );
        }
      }
    }
  }
}