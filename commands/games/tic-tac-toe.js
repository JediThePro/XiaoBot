const { Command } = require('discord.js-commando');
const { stripIndents } = require('common-tags');
const { verify } = require('../../util/Util');

module.exports = class TicTacToeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tic-tac-toe',
			group: 'games',
			memberName: 'tic-tac-toe',
			description: 'Play a game of tic-tac-toe.',
			args: [
				{
					key: 'opponent',
					prompt: 'What user would you like to challenge?',
					type: 'user'
				}
			]
		});

		this.playing = new Set();
	}

	async run(msg, { opponent }) { // eslint-disable-line complexity
		if (opponent.bot) return msg.say('Bots may not be played against.');
		if (opponent.id === msg.author.id) return msg.say('You may not play against yourself.');
		if (this.playing.has(msg.channel.id)) return msg.say('Only one game may be occurring per channel.');
		this.playing.add(msg.channel.id);
		try {
			await msg.say(`${opponent}, do you accept this challenge?`);
			const verification = await verify(msg.channel, opponent);
			if (!verification) {
				this.playing.delete(msg.channel.id);
				return msg.say('Looks like they declined...');
			}
			const sides = ['0', '1', '2', '3', '4', '5', '6', '7', '8'];
			const taken = [];
			let userTurn = true;
			let winner = null;
			while (!winner && taken.length < 9) {
				const user = userTurn ? msg.author : opponent;
				const sign = userTurn ? 'X' : 'O';
				await msg.say(stripIndents`
					${user}, which side do you pick?
					\`\`\`
					${sides[0]} | ${sides[1]} | ${sides[2]}
					—————————
					${sides[3]} | ${sides[4]} | ${sides[5]}
					—————————
					${sides[6]} | ${sides[7]} | ${sides[8]}
					\`\`\`
				`);
				const turn = await msg.channel.awaitMessages(res => res.author.id === user.id, {
					max: 1,
					time: 30000
				});
				if (!turn.size) {
					await msg.say('Time!');
					userTurn = !userTurn;
					continue;
				}
				const choice = turn.first().content.toLowerCase();
				if (choice === 'end') break;
				if (taken.includes(choice)) {
					await msg.say('That spot is already taken!');
				} else if (!sides.includes(choice)) {
					await msg.say('I don\'t think that is a valid spot...');
				} else {
					sides[parseInt(choice, 10)] = sign;
					taken.push(choice);
					if ((sides[0] === sides[1] && sides[0] === sides[2])
						|| (sides[0] === sides[3] && sides[0] === sides[6])
						|| (sides[3] === sides[4] && sides[3] === sides[5])
						|| (sides[1] === sides[4] && sides[1] === sides[7])
						|| (sides[6] === sides[7] && sides[6] === sides[8])
						|| (sides[2] === sides[5] && sides[2] === sides[8])
						|| (sides[0] === sides[4] && sides[0] === sides[8])
						|| (sides[2] === sides[4] && sides[2] === sides[6])) {
						winner = userTurn ? msg.author : opponent;
					}
					userTurn = !userTurn;
				}
			}
			this.playing.delete(msg.channel.id);
			return msg.say(winner ? `Congrats, ${winner}!` : 'Oh... The cat won.');
		} catch (err) {
			this.playing.delete(msg.channel.id);
			throw err;
		}
	}
};
