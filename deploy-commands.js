require('dotenv').config();
const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// =========================
// COMANDO /create
// =========================
const createCmd = new SlashCommandBuilder()
  .setName('create')
  .setDescription('Cria uma categoria e canais dentro dela.')
  // Exige permissão de ManageChannels
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  // Desabilita para uso em DM
  .setDMPermission(false)

  // Opções obrigatórias primeiro
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

  // Depois as opções opcionais
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

// =========================
// COMANDO /channelvisible
// =========================
const channelVisibleCmd = new SlashCommandBuilder()
  .setName('channelvisible')
  .setDescription('Concede permissão de visualização a certos cargos para todos os canais com um nome específico.')
  // Exige permissão de ManageChannels para usar
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .setDMPermission(false)
  // Opção obrigatória primeiro
  .addStringOption(option =>
    option
      .setName('channelname')
      .setDescription('Nome exato do(s) canal(is).')
      .setRequired(true)
  )
  // Depois as opções opcionais
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

// =========================
// COMANDO /delete-category
// =========================
const deleteCategoryCmd = new SlashCommandBuilder()
  .setName('delete-category')
  .setDescription('Deleta uma categoria e todos os seus canais.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .setDMPermission(false)
  .addStringOption(option =>
    option
      .setName('categoria')
      .setDescription('Nome da categoria que será deletada')
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option
      .setName('confirmar')
      .setDescription('Confirma que deseja deletar a categoria e TODOS os seus canais')
      .setRequired(true)
  );

// =========================
// COMANDO /channel-rename
// =========================
const channelRenameCmd = new SlashCommandBuilder()
  .setName('channel-rename')
  .setDescription('Renomeia múltiplos canais de uma vez.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .setDMPermission(false)
  // Opções obrigatórias primeiro
  .addStringOption(option =>
    option
      .setName('buscar')
      .setDescription('Nome ou parte do nome dos canais que deseja renomear')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('novo_nome')
      .setDescription('Novo nome para os canais (use {n} para numeração automática)')
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option
      .setName('confirmar')
      .setDescription('Confirma que deseja renomear os canais encontrados')
      .setRequired(true)
  )
  // Depois a opção opcional
  .addStringOption(option =>
    option
      .setName('categoria')
      .setDescription('Nome da categoria para filtrar (opcional)')
      .setRequired(false)
  );

// =========================
// COMANDO /clone-category
// =========================
const cloneCategoryCmd = new SlashCommandBuilder()
  .setName('clone-category')
  .setDescription('Clona uma categoria existente com todos os seus canais e permissões.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .setDMPermission(false)
  // Opções obrigatórias primeiro
  .addStringOption(option =>
    option
      .setName('categoria_origem')
      .setDescription('Nome da categoria que será clonada')
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option
      .setName('clonar_permissoes')
      .setDescription('Clonar as permissões da categoria e canais?')
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option
      .setName('confirmar')
      .setDescription('Confirma que deseja clonar a categoria e seus canais')
      .setRequired(true)
  )
  // Depois a opção opcional
  .addStringOption(option =>
    option
      .setName('categoria_destino')
      .setDescription('Nome da nova categoria (deixe vazio para adicionar "- Clone" ao nome original)')
      .setRequired(false)
  );

// =========================
// COMANDO /auto-create
// =========================
const autoCreateCmd = new SlashCommandBuilder()
  .setName('auto-create')
  .setDescription('Configura criação automática de canais baseada em eventos.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .setDMPermission(false)
  // Opções obrigatórias primeiro
  .addStringOption(option =>
    option
      .setName('evento')
      .setDescription('Evento que dispara a criação do canal')
      .setRequired(true)
      .addChoices(
        { name: 'Novo Membro', value: 'member_join' },
        { name: 'Novo Cargo', value: 'role_create' },
        { name: 'Novo Boost', value: 'server_boost' }
      )
  )
  .addStringOption(option =>
    option
      .setName('categoria')
      .setDescription('Nome da categoria onde os canais serão criados')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('padrao_nome')
      .setDescription('Padrão do nome do canal. Use {name} para nome do membro/cargo, {n} para número')
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option
      .setName('privado')
      .setDescription('Se o canal deve ser privado (visível apenas para o membro/cargo)')
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option
      .setName('ativar')
      .setDescription('Ativar ou desativar a criação automática')
      .setRequired(true)
  )
  // Depois a opção opcional
  .addRoleOption(option =>
    option
      .setName('cargo_acesso')
      .setDescription('Cargo que terá acesso ao canal criado')
      .setRequired(false)
  );

// =========================
// COMANDO /auto-create-category-clone
// =========================
const autoCreateCategoryCloneCmd = new SlashCommandBuilder()
  .setName('auto-create-category-clone')
  .setDescription('Configura criação automática de categorias para novos membros baseada em uma categoria modelo.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .setDMPermission(false)
  // Opções obrigatórias primeiro
  .addStringOption(option =>
    option
      .setName('categoria_modelo')
      .setDescription('Nome da categoria que servirá como modelo')
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option
      .setName('ativar')
      .setDescription('Ativar ou desativar a criação automática de categorias')
      .setRequired(true)
  )
  // Depois as opções opcionais
  .addRoleOption(option =>
    option
      .setName('cargo_acesso')
      .setDescription('Cargo adicional que terá acesso às categorias criadas')
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('prefixo')
      .setDescription('Prefixo para o nome da categoria (ex: "Área de ")')
      .setRequired(false)
  );

// =========================
// COMANDO /auto-channel-access
// =========================
const autoChannelAccessCmd = new SlashCommandBuilder()
  .setName('auto-channel-access')
  .setDescription('Configura acesso automático a cargos para canais criados com nomes específicos.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .setDMPermission(false)
  // Opções obrigatórias primeiro
  .addStringOption(option =>
    option
      .setName('padrao_nome')
      .setDescription('Nome ou padrão de nome do canal (ex: "suporte-" para todos que começam com "suporte-")')
      .setRequired(true)
  )
  .addRoleOption(option =>
    option
      .setName('cargo')
      .setDescription('Cargo que receberá acesso automático aos canais')
      .setRequired(true)
  )
  .addBooleanOption(option =>
    option
      .setName('ativar')
      .setDescription('Ativar ou desativar o acesso automático')
      .setRequired(true)
  )
  // Depois as opções opcionais
  .addStringOption(option =>
    option
      .setName('categoria')
      .setDescription('Nome da categoria onde a regra se aplica (opcional)')
      .setRequired(false)
  );

// =========================
// REGISTRO GLOBAL
// =========================
const commands = [channelVisibleCmd, createCmd, deleteCategoryCmd, channelRenameCmd, cloneCategoryCmd, autoCreateCmd, autoCreateCategoryCloneCmd, autoChannelAccessCmd];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registrando comandos globalmente...');

    // Registra globalmente em todos os servidores onde o bot for adicionado.
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      {
        body: commands.map(cmd => cmd.toJSON()),
      }
    );

    console.log('Comandos registrados globalmente com sucesso!');
    console.log('OBS: Pode levar até 1 hora para aparecerem em todos os servidores.');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
})();
