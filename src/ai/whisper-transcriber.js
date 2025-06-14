'use strict';

const fs = require('fs');
const { randomBytes } = require('crypto');
const OpenAI = require('openai');
const env = require('../utils/env');

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/**
 * Downloads a voice file from Telegram and transcribes it using Whisper.
 * @param {TelegramBot} bot
 * @param {TelegramBot.Voice} voice
 * @returns {Promise<string>}
 */
async function transcribe(bot, voice) {
  try {
    const fileLink = await bot.getFileLink(voice.file_id);
    const res = await fetch(fileLink);
    const buffer = Buffer.from(await res.arrayBuffer());

    const tempPath = `./voice_${randomBytes(6).toString('hex')}.ogg`;
    fs.writeFileSync(tempPath, buffer);

    const result = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempPath),
      model: 'whisper-1',
    });

    fs.unlinkSync(tempPath);
    return result.text.trim();
  } catch (err) {
    console.error('Whisper error:', err);
    return '';
  }
}

module.exports = transcribe;
