const { Command } = require('discord.js-commando');
const snekfetch = require('snekfetch');

module.exports = class AnagramCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'anagram',
			group: 'text-edit',
			memberName: 'anagram',
			description: 'Gets an anagram for a word.',
			args: [
				{
					key: 'word',
					prompt: 'What word would you like to get an anagram for?',
					type: 'string',
					parse: word => encodeURIComponent(word.toLowerCase())
				},
				{
					key: 'strict',
					prompt: 'Would you like to get only words that contain all letters?',
					type: 'boolean',
					default: true
				}
			]
		});
	}

	async run(msg, { word, strict }) {
		try {
			const { body } = await snekfetch.get(`http://www.anagramica.com/best/${word}`);
			if (!body.best.length) return msg.say('Could not find any results.');
			const words = strict ? body.best.filter(anagram => anagram.length === word.length) : body.best;
			return msg.say(words[Math.floor(Math.random() * words.length)]);
		} catch (err) {
			if (err.status === 500) return msg.say('Could not find any results.');
			return msg.say(`Oh no, an error occurred: \`${err.message}\`. Try again later!`);
		}
	}
};
