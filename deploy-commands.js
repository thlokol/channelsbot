require('dotenv').config();
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

const createCmd = new SlashCommandBuilder()
  .setName('create')
  .setDescription('Cria uma categoria e canais dentro dela.')
  // Exige permissão de ManageChannels
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  // Desabilita para uso em DM
  .setDMPermission(false)

  // Opções obrigatórias
  .addStringOption(option =>
    option
      .setName('categoria')
      .setDescription('Nome da categoria a ser criada')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('canais')
      .setDescription('Nomes dos canais, separados por espaço')
      .setRequired(true)
  )

  // Até 5 cargos opcionais
  .addRoleOption(option =>
    option
      .setName('cargo1')
      .setDescription('Cargo que poderá ver a categoria (1)')
      .setRequired(false)
  )
  .addRoleOption(option =>
    option
      .setName('cargo2')
      .setDescription('Cargo que poderá ver a categoria (2)')
      .setRequired(false)
  )
  .addRoleOption(option =>
    option
      .setName('cargo3')
      .setDescription('Cargo que poderá ver a categoria (3)')
      .setRequired(false)
  )
  .addRoleOption(option =>
    option
      .setName('cargo4')
      .setDescription('Cargo que poderá ver a categoria (4)')
      .setRequired(false)
  )
  .addRoleOption(option =>
    option
      .setName('cargo5')
      .setDescription('Cargo que poderá ver a categoria (5)')
      .setRequired(false)
  )

  // Até 5 usuários opcionais
  .addUserOption(option =>
    option
      .setName('user1')
      .setDescription('Usuário que poderá ver a categoria (1)')
      .setRequired(false)
  )
  .addUserOption(option =>
    option
      .setName('user2')
      .setDescription('Usuário que poderá ver a categoria (2)')
      .setRequired(false)
  )
  .addUserOption(option =>
    option
      .setName('user3')
      .setDescription('Usuário que poderá ver a categoria (3)')
      .setRequired(false)
  )
  .addUserOption(option =>
    option
      .setName('user4')
      .setDescription('Usuário que poderá ver a categoria (4)')
      .setRequired(false)
  )
  .addUserOption(option =>
    option
      .setName('user5')
      .setDescription('Usuário que poderá ver a categoria (5)')
      .setRequired(false)
  );

const channelVisibleCmd = new SlashCommandBuilder()
.setName('channelvisible')
.setDescription('Concede permissão de visualização a certos cargos para todos os canais com um nome específico.')
// Exige permissão de ManageChannels para usar
.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
.setDMPermission(false)
// Opção obrigatória: nome do canal (string)
.addStringOption(option =>
  option
    .setName('channelname')
    .setDescription('Nome exato do(s) canal(is).')
    .setRequired(true)
)
// Até 5 cargos opcionais
.addRoleOption(option =>
  option
    .setName('cargo1')
    .setDescription('Cargo que poderá ver os canais (1)')
    .setRequired(false)
)
.addRoleOption(option =>
  option
    .setName('cargo2')
    .setDescription('Cargo que poderá ver os canais (2)')
    .setRequired(false)
)
.addRoleOption(option =>
  option
    .setName('cargo3')
    .setDescription('Cargo que poderá ver os canais (3)')
    .setRequired(false)
)
.addRoleOption(option =>
  option
    .setName('cargo4')
    .setDescription('Cargo que poderá ver os canais (4)')
    .setRequired(false)
)
.addRoleOption(option =>
  option
    .setName('cargo5')
    .setDescription('Cargo que poderá ver os canais (5)')
    .setRequired(false)
);
const commands = [channelVisibleCmd, createCmd];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      {
        body: commands.map(cmd => cmd.toJSON()),
      }
    );

    console.log('Comandos registrados com sucesso!');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
})();
