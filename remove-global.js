require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Removendo todos os comandos globais...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID), 
      { body: [] }
    );
    console.log('Comandos globais removidos com sucesso!');
  } catch (error) {
    console.error('Erro ao remover comandos globais:', error);
  }
})();
