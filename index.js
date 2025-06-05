require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

// Arquivo de configurações
const CONFIG_FILE = path.join(__dirname, 'bot-configs.json');

// Função para carregar configurações do arquivo
async function loadConfigs() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    const configs = JSON.parse(data);
    
    // Restaura as configurações nos Maps
    if (configs.autoCreateConfigs) {
      configs.autoCreateConfigs.forEach(([key, value]) => {
        autoCreateConfigs.set(key, value);
      });
    }
    
    if (configs.autoCategoryCloneConfigs) {
      configs.autoCategoryCloneConfigs.forEach(([key, value]) => {
        autoCategoryCloneConfigs.set(key, value);
      });
    }
    
    if (configs.autoChannelAccessConfigs) {
      configs.autoChannelAccessConfigs.forEach(([key, value]) => {
        autoChannelAccessConfigs.set(key, value);
      });
    }
    
    if (configs.autoRoleConfigs) {
      configs.autoRoleConfigs.forEach(([key, value]) => {
        autoRoleConfigs.set(key, value);
      });
    }
    
    console.log('Configurações carregadas com sucesso!');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Arquivo de configurações não encontrado. Criando um novo...');
      await saveConfigs();
    } else {
      console.error('Erro ao carregar configurações:', error);
    }
  }
}

// Função para salvar configurações no arquivo
async function saveConfigs() {
  try {
    const configs = {
      autoCreateConfigs: Array.from(autoCreateConfigs.entries()),
      autoCategoryCloneConfigs: Array.from(autoCategoryCloneConfigs.entries()),
      autoChannelAccessConfigs: Array.from(autoChannelAccessConfigs.entries()),
      autoRoleConfigs: Array.from(autoRoleConfigs.entries()),
    };
    
    await fs.writeFile(CONFIG_FILE, JSON.stringify(configs, null, 2));
    console.log('Configurações salvas com sucesso!');
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
  }
}

// Armazena as configurações de auto-create por servidor
const autoCreateConfigs = new Map();

// Armazena as configurações de auto-create-category-clone por servidor
const autoCategoryCloneConfigs = new Map();

// Armazena as configurações de auto-channel-access por servidor
const autoChannelAccessConfigs = new Map();

// Armazena as configurações de auto-role por servidor
const autoRoleConfigs = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,  // Necessário para eventos de membros
  ],
});

client.once('ready', async () => {
  console.log(`Bot conectado como ${client.user.tag}`);
  
  // Carrega as configurações salvas
  await loadConfigs();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // ----------------------------------------------------------------------------
  // COMANDO /create
  // ----------------------------------------------------------------------------
  if (interaction.commandName === 'create') {
    try {
      // Dá um "ack" ao Discord, prevenindo timeout
      await interaction.deferReply();

      // Opções básicas
      const categoryName = interaction.options.getString('categoria');
      const channelsString = interaction.options.getString('canais');
      const channelNames = channelsString.split(' ');

      // Lista de cargos selecionados (cargo1..cargo5)
      const cargos = [];
      for (let i = 1; i <= 5; i++) {
        const role = interaction.options.getRole(`cargo${i}`);
        if (role) cargos.push(role);
      }

      // Lista de usuários selecionados (user1..user5)
      const usuarios = [];
      for (let i = 1; i <= 5; i++) {
        const user = interaction.options.getUser(`user${i}`);
        if (user) usuarios.push(user);
      }

      // Monta permissão: nega a todos (@everyone)
      const permissionOverwrites = [
        {
          id: interaction.guild.id, // @everyone
          deny: [PermissionFlagsBits.ViewChannel],
        },
      ];

      // Libera acesso para cada cargo selecionado
      cargos.forEach((role) => {
        permissionOverwrites.push({
          id: role.id,
          allow: [PermissionFlagsBits.ViewChannel],
        });
      });

      // Libera acesso para cada usuário selecionado
      usuarios.forEach((user) => {
        permissionOverwrites.push({
          id: user.id,
          allow: [PermissionFlagsBits.ViewChannel],
        });
      });

      // Cria a categoria
      const category = await interaction.guild.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory,
        permissionOverwrites,
      });

      // Cria os canais de texto dentro da categoria
      for (const chName of channelNames) {
        await interaction.guild.channels.create({
          name: chName,
          type: ChannelType.GuildText,
          parent: category.id,
        });
      }

      // Monta uma string para mostrar quem tem acesso
      const rolesStr = cargos.length
        ? cargos.map((r) => r.name).join(', ')
        : 'Nenhum';
      const usersStr = usuarios.length
        ? usuarios.map((u) => u.tag).join(', ')
        : 'Nenhum';

      await interaction.editReply(
        `Categoria **${categoryName}** criada com ${channelNames.length} canal(is).\n` +
          `Cargo(s) permitidos: ${rolesStr}\n` +
          `Usuário(s) permitidos: ${usersStr}`
      );
    } catch (error) {
      console.error('Erro ao criar categoria/canais:', error);
      if (interaction.deferred) {
        await interaction.editReply(
          'Ocorreu um erro ao criar a categoria e os canais.'
        );
      } else {
        await interaction.reply(
          'Ocorreu um erro ao criar a categoria e os canais.'
        );
      }
    }
  }

  // ----------------------------------------------------------------------------
  // COMANDO /channelvisible
  // ----------------------------------------------------------------------------
  if (interaction.commandName === 'channelvisible') {
    try {
      await interaction.deferReply();

      // 1) Pega o nome do canal do comando
      const channelName = interaction.options.getString('channelname');

      // 2) Coleta até 5 cargos (cargo1..cargo5)
      const cargos = [];
      for (let i = 1; i <= 5; i++) {
        const role = interaction.options.getRole(`cargo${i}`);
        if (role) cargos.push(role);
      }

      // Se nenhum cargo foi fornecido, avisamos e encerramos
      if (!cargos.length) {
        await interaction.editReply('Nenhum cargo foi selecionado!');
        return;
      }

      // 3) Filtrar todos os canais com esse nome exato
      //    (Se quiser partial match, use .includes(channelName))
      const matchedChannels = interaction.guild.channels.cache.filter(
        (ch) => ch.name === channelName
      );

      if (!matchedChannels.size) {
        await interaction.editReply(
          `Não encontrei canais com o nome "${channelName}".`
        );
        return;
      }

      // 4) Para cada canal encontrado, dar ViewChannel aos cargos
      for (const [, channel] of matchedChannels) {
        // Se quiser garantir que seja texto, verifique type:
        // if (channel.type !== ChannelType.GuildText) continue;

        for (const r of cargos) {
          await channel.permissionOverwrites.edit(r.id, {
            ViewChannel: true,
          });
        }
      }

      // Monta uma string dos canais e cargos afetados
      const channelList = matchedChannels
        .map((ch) => `#${ch.name}`)
        .join(', ');
      const roleList = cargos.map((r) => r.name).join(', ');
      await interaction.editReply(
        `Concedi permissão de visualização para [${roleList}] nos canais: ${channelList}.`
      );
    } catch (error) {
      console.error('Erro no comando /channelvisible:', error);
      if (interaction.deferred) {
        await interaction.editReply('Ocorreu um erro ao conceder permissões.');
      } else {
        await interaction.reply('Ocorreu um erro ao conceder permissões.');
      }
    }
  }

  // ----------------------------------------------------------------------------
  // COMANDO /delete-category
  // ----------------------------------------------------------------------------
  if (interaction.commandName === 'delete-category') {
    try {
      await interaction.deferReply();

      const categoryName = interaction.options.getString('categoria');
      const confirmDelete = interaction.options.getBoolean('confirmar');

      if (!confirmDelete) {
        await interaction.editReply('Operação cancelada. Você precisa confirmar a exclusão marcando a opção "confirmar".')
          .catch(error => console.error('Erro ao responder interação (timeout):', error));
        return;
      }

      // Procura a categoria pelo nome
      const category = interaction.guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildCategory && ch.name === categoryName
      );

      if (!category) {
        await interaction.editReply(`Não encontrei nenhuma categoria chamada "${categoryName}".`)
          .catch(error => console.error('Erro ao responder interação (timeout):', error));
        return;
      }

      // Lista todos os canais da categoria
      const channelsInCategory = interaction.guild.channels.cache.filter(
        ch => ch.parentId === category.id
      );

      // Deleta todos os canais da categoria
      for (const [, channel] of channelsInCategory) {
        await channel.delete();
      }

      // Deleta a categoria
      await category.delete();

      await interaction.editReply(
        `Categoria **${categoryName}** e seus ${channelsInCategory.size} canal(is) foram deletados com sucesso.`
      ).catch(error => {
        // Se a interação expirou, apenas registramos no console em vez de crashar
        console.error('Erro ao responder interação após deletar categoria (provavelmente timeout):', error.code);
      });

    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      try {
        if (interaction.deferred) {
          await interaction.editReply('Ocorreu um erro ao deletar a categoria e seus canais.')
            .catch(replyError => console.error('Erro ao responder após falha (timeout):', replyError.code));
        } else {
          await interaction.reply('Ocorreu um erro ao deletar a categoria e seus canais.')
            .catch(replyError => console.error('Erro ao responder após falha (timeout):', replyError.code));
        }
      } catch (finalError) {
        console.error('Erro crítico ao responder interação:', finalError);
      }
    }
  }

  // ----------------------------------------------------------------------------
  // COMANDO /channel-rename
  // ----------------------------------------------------------------------------
  if (interaction.commandName === 'channel-rename') {
    try {
      await interaction.deferReply();

      const searchName = interaction.options.getString('buscar');
      const newNamePattern = interaction.options.getString('novo_nome');
      const categoryName = interaction.options.getString('categoria');
      const confirmRename = interaction.options.getBoolean('confirmar');

      if (!confirmRename) {
        await interaction.editReply('Operação cancelada. Você precisa confirmar o renomeamento marcando a opção "confirmar".');
        return;
      }

      // Se uma categoria foi especificada, encontra ela primeiro
      let category = null;
      if (categoryName) {
        category = interaction.guild.channels.cache.find(
          ch => ch.type === ChannelType.GuildCategory && ch.name === categoryName
        );

        if (!category) {
          await interaction.editReply(`Não encontrei nenhuma categoria chamada "${categoryName}".`);
          return;
        }
      }

      // Encontra todos os canais que correspondem ao critério de busca
      const matchedChannels = interaction.guild.channels.cache.filter(ch => {
        // Deve ser um canal de texto
        if (ch.type !== ChannelType.GuildText) return false;
        
        // Se uma categoria foi especificada, o canal deve estar nela
        if (category && ch.parentId !== category.id) return false;
        
        // O nome do canal deve conter o termo de busca
        return ch.name.includes(searchName);
      });

      if (!matchedChannels.size) {
        await interaction.editReply(
          `Não encontrei canais${category ? ' na categoria especificada' : ''} contendo "${searchName}" no nome.`
        );
        return;
      }

      // Renomeia os canais encontrados
      let counter = 1;
      const oldToNewNames = [];

      for (const [, channel] of matchedChannels) {
        const oldName = channel.name;
        // Substitui {n} pelo número do contador
        const newName = newNamePattern.replace('{n}', counter.toString());
        
        await channel.setName(newName);
        oldToNewNames.push(`#${oldName} → #${newName}`);
        counter++;
      }

      await interaction.editReply(
        `${matchedChannels.size} canal(is) renomeado(s) com sucesso:\n` +
        oldToNewNames.join('\n')
      );

    } catch (error) {
      console.error('Erro ao renomear canais:', error);
      if (interaction.deferred) {
        await interaction.editReply('Ocorreu um erro ao renomear os canais.');
      } else {
        await interaction.reply('Ocorreu um erro ao renomear os canais.');
      }
    }
  }

  // ----------------------------------------------------------------------------
  // COMANDO /clone-category
  // ----------------------------------------------------------------------------
  if (interaction.commandName === 'clone-category') {
    try {
      await interaction.deferReply();

      const sourceCategoryName = interaction.options.getString('categoria_origem');
      let targetCategoryName = interaction.options.getString('categoria_destino');
      const clonePermissions = interaction.options.getBoolean('clonar_permissoes');
      const confirmClone = interaction.options.getBoolean('confirmar');

      if (!confirmClone) {
        await interaction.editReply('Operação cancelada. Você precisa confirmar a clonagem marcando a opção "confirmar".');
        return;
      }

      // Procura a categoria de origem
      const sourceCategory = interaction.guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildCategory && ch.name === sourceCategoryName
      );

      if (!sourceCategory) {
        await interaction.editReply(`Não encontrei nenhuma categoria chamada "${sourceCategoryName}".`);
        return;
      }

      // Se não foi especificado um nome para a nova categoria, usa o nome original + "- Clone"
      if (!targetCategoryName) {
        targetCategoryName = `${sourceCategoryName} - Clone`;
      }

      // Lista todos os canais da categoria de origem
      const sourceChannels = interaction.guild.channels.cache.filter(
        ch => ch.parentId === sourceCategory.id
      );

      // Prepara as permissões da nova categoria
      let permissionOverwrites = [];
      if (clonePermissions) {
        permissionOverwrites = sourceCategory.permissionOverwrites.cache.map(perm => ({
          id: perm.id,
          type: perm.type,
          allow: perm.allow,
          deny: perm.deny
        }));
      }

      // Cria a nova categoria
      const newCategory = await interaction.guild.channels.create({
        name: targetCategoryName,
        type: ChannelType.GuildCategory,
        permissionOverwrites: clonePermissions ? permissionOverwrites : []
      });

      // Clona todos os canais
      const clonedChannels = [];
      for (const [, channel] of sourceChannels) {
        // Prepara as permissões do canal
        let channelPermissions = [];
        if (clonePermissions) {
          channelPermissions = channel.permissionOverwrites.cache.map(perm => ({
            id: perm.id,
            type: perm.type,
            allow: perm.allow,
            deny: perm.deny
          }));
        }

        // Cria o novo canal
        const newChannel = await interaction.guild.channels.create({
          name: channel.name,
          type: channel.type,
          topic: channel.topic,
          nsfw: channel.nsfw,
          parent: newCategory.id,
          permissionOverwrites: clonePermissions ? channelPermissions : []
        });

        clonedChannels.push(`#${newChannel.name}`);
      }

      await interaction.editReply(
        `Categoria **${sourceCategoryName}** clonada com sucesso para **${targetCategoryName}**.\n` +
        `${clonedChannels.length} canal(is) clonado(s):\n` +
        clonedChannels.join(', ') + '\n\n' +
        `Permissões ${clonePermissions ? 'foram' : 'não foram'} clonadas.`
      );

    } catch (error) {
      console.error('Erro ao clonar categoria:', error);
      if (interaction.deferred) {
        await interaction.editReply('Ocorreu um erro ao clonar a categoria e seus canais.');
      } else {
        await interaction.reply('Ocorreu um erro ao clonar a categoria e seus canais.');
      }
    }
  }

  // ----------------------------------------------------------------------------
  // COMANDO /auto-create
  // ----------------------------------------------------------------------------
  if (interaction.commandName === 'auto-create') {
    try {
      await interaction.deferReply();

      const evento = interaction.options.getString('evento');
      const categoryName = interaction.options.getString('categoria');
      const namePattern = interaction.options.getString('padrao_nome');
      const accessRole = interaction.options.getRole('cargo_acesso');
      const isPrivate = interaction.options.getBoolean('privado');
      const isEnabled = interaction.options.getBoolean('ativar');

      // Verifica se a categoria existe
      const category = interaction.guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildCategory && ch.name === categoryName
      );

      if (!category) {
        await interaction.editReply(`Não encontrei nenhuma categoria chamada "${categoryName}".`);
        return;
      }

      // Se estiver desativando, remove a configuração
      if (!isEnabled) {
        const guildConfigs = autoCreateConfigs.get(interaction.guildId) || {};
        delete guildConfigs[evento];
        
        if (Object.keys(guildConfigs).length === 0) {
          autoCreateConfigs.delete(interaction.guildId);
        } else {
          autoCreateConfigs.set(interaction.guildId, guildConfigs);
        }

        // Salva as configurações no arquivo
        await saveConfigs();

        await interaction.editReply(`Criação automática para o evento "${evento}" foi desativada.`);
        return;
      }

      // Salva a configuração
      const config = {
        categoryId: category.id,
        namePattern,
        accessRoleId: accessRole?.id,
        isPrivate,
      };

      const guildConfigs = autoCreateConfigs.get(interaction.guildId) || {};
      guildConfigs[evento] = config;
      autoCreateConfigs.set(interaction.guildId, guildConfigs);

      // Salva as configurações no arquivo
      await saveConfigs();

      await interaction.editReply(
        `Criação automática configurada:\n` +
        `• Evento: ${evento}\n` +
        `• Categoria: ${categoryName}\n` +
        `• Padrão de nome: ${namePattern}\n` +
        `• Cargo de acesso: ${accessRole ? accessRole.name : 'Nenhum'}\n` +
        `• Canal privado: ${isPrivate ? 'Sim' : 'Não'}`
      );

    } catch (error) {
      console.error('Erro ao configurar auto-create:', error);
      if (interaction.deferred) {
        await interaction.editReply('Ocorreu um erro ao configurar a criação automática.');
      } else {
        await interaction.reply('Ocorreu um erro ao configurar a criação automática.');
      }
    }
  }

  // ----------------------------------------------------------------------------
  // COMANDO /auto-create-category-clone
  // ----------------------------------------------------------------------------
  if (interaction.commandName === 'auto-create-category-clone') {
    try {
      await interaction.deferReply();

      const categoryModelName = interaction.options.getString('categoria_modelo');
      const isEnabled = interaction.options.getBoolean('ativar');
      const accessRole = interaction.options.getRole('cargo_acesso');
      const prefix = interaction.options.getString('prefixo') || '';

      // Verifica se a categoria modelo existe
      const categoryModel = interaction.guild.channels.cache.find(
        ch => ch.type === ChannelType.GuildCategory && ch.name === categoryModelName
      );

      if (!categoryModel) {
        await interaction.editReply(`Não encontrei nenhuma categoria chamada "${categoryModelName}".`);
        return;
      }

      // Se estiver desativando, remove a configuração
      if (!isEnabled) {
        autoCategoryCloneConfigs.delete(interaction.guildId);
        
        // Salva as configurações no arquivo
        await saveConfigs();
        
        await interaction.editReply(`Criação automática de categorias para novos membros foi desativada.`);
        return;
      }

      // Lista todos os canais da categoria modelo
      const channelsInCategory = interaction.guild.channels.cache.filter(
        ch => ch.parentId === categoryModel.id
      );

      if (!channelsInCategory.size) {
        await interaction.editReply(`A categoria "${categoryModelName}" não possui canais para serem clonados.`);
        return;
      }

      // Salva a configuração
      const config = {
        categoryModelId: categoryModel.id,
        categoryModelName: categoryModelName,
        accessRoleId: accessRole?.id,
        prefix: prefix
      };

      autoCategoryCloneConfigs.set(interaction.guildId, config);

      // Salva as configurações no arquivo
      await saveConfigs();

      await interaction.editReply(
        `Criação automática de categorias configurada:\n` +
        `• Categoria modelo: ${categoryModelName}\n` +
        `• Cargo adicional de acesso: ${accessRole ? accessRole.name : 'Nenhum'}\n` +
        `• Prefixo: ${prefix ? prefix : 'Nenhum'}\n\n` +
        `Quando um novo membro entrar no servidor, será criada uma categoria com ${channelsInCategory.size} canal(is) baseada no modelo.`
      );

    } catch (error) {
      console.error('Erro ao configurar auto-create-category-clone:', error);
      if (interaction.deferred) {
        await interaction.editReply('Ocorreu um erro ao configurar a criação automática de categorias.');
      } else {
        await interaction.reply('Ocorreu um erro ao configurar a criação automática de categorias.');
      }
    }
  }

  // ----------------------------------------------------------------------------
  // COMANDO /auto-role
  // ----------------------------------------------------------------------------
  if (interaction.commandName === 'auto-role') {
    try {
      await interaction.deferReply();

      const role = interaction.options.getRole('cargo');
      const isEnabled = interaction.options.getBoolean('ativar');

      // Verifica permissões do bot
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        await interaction.editReply('Não tenho permissão para gerenciar cargos neste servidor.')
          .catch(error => console.error('Erro ao responder interação (timeout):', error));
        return;
      }

      // Verifica se o cargo pode ser atribuído pelo bot (comparando posições)
      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        await interaction.editReply(
          `Não posso atribuir o cargo ${role.name} pois ele está acima ou na mesma posição que meu cargo mais alto.`
        ).catch(error => console.error('Erro ao responder interação (timeout):', error));
        return;
      }

      // Se estiver desativando
      if (!isEnabled) {
        autoRoleConfigs.delete(interaction.guildId);
        
        // Salva as configurações no arquivo
        await saveConfigs();
        
        await interaction.editReply(`Atribuição automática de cargo para novos membros foi desativada.`)
          .catch(error => console.error('Erro ao responder interação (timeout):', error));
        return;
      }

      // Salva a configuração
      autoRoleConfigs.set(interaction.guildId, {
        roleId: role.id
      });

      // Salva as configurações no arquivo
      await saveConfigs();

      await interaction.editReply(
        `Atribuição automática de cargo configurada:\n` +
        `• Cargo: ${role.name}\n\n` +
        `Todos os novos membros que entrarem no servidor receberão automaticamente o cargo ${role.name}.`
      ).catch(error => console.error('Erro ao responder interação (timeout):', error));

    } catch (error) {
      console.error('Erro ao configurar auto-role:', error);
      try {
        if (interaction.deferred) {
          await interaction.editReply('Ocorreu um erro ao configurar a atribuição automática de cargo.')
            .catch(replyError => console.error('Erro ao responder após falha (timeout):', replyError.code));
        } else {
          await interaction.reply('Ocorreu um erro ao configurar a atribuição automática de cargo.')
            .catch(replyError => console.error('Erro ao responder após falha (timeout):', replyError.code));
        }
      } catch (finalError) {
        console.error('Erro crítico ao responder interação:', finalError);
      }
    }
  }

  // ----------------------------------------------------------------------------
  // COMANDO /auto-channel-access
  // ----------------------------------------------------------------------------
  if (interaction.commandName === 'auto-channel-access') {
    try {
      await interaction.deferReply();

      const pattern = interaction.options.getString('padrao_nome');
      const role = interaction.options.getRole('cargo');
      const categoryName = interaction.options.getString('categoria');
      const isEnabled = interaction.options.getBoolean('ativar');

      // Verifica a categoria, se informada
      let categoryId = null;
      if (categoryName) {
        const category = interaction.guild.channels.cache.find(
          ch => ch.type === ChannelType.GuildCategory && ch.name === categoryName
        );

        if (!category) {
          await interaction.editReply(`Não encontrei nenhuma categoria chamada "${categoryName}".`)
            .catch(error => console.error('Erro ao responder interação (timeout):', error));
          return;
        }
        categoryId = category.id;
      }

      // Se estiver desativando
      if (!isEnabled) {
        // Obtém as configurações existentes para o servidor
        const guildConfigs = autoChannelAccessConfigs.get(interaction.guildId) || [];
        
        // Remove configurações com o mesmo padrão e categoria
        const updatedConfigs = guildConfigs.filter(
          config => config.pattern !== pattern || config.categoryId !== categoryId
        );
        
        if (updatedConfigs.length === 0) {
          // Se não há mais configurações, remove a entrada do servidor
          autoChannelAccessConfigs.delete(interaction.guildId);
        } else {
          // Atualiza as configurações
          autoChannelAccessConfigs.set(interaction.guildId, updatedConfigs);
        }

        // Salva as configurações no arquivo
        await saveConfigs();

        await interaction.editReply(
          `Acesso automático para canais com padrão "${pattern}" ${categoryName ? `na categoria "${categoryName}" ` : ''}foi desativado.`
        ).catch(error => console.error('Erro ao responder interação (timeout):', error));
        return;
      }

      // Configuração a ser salva
      const newConfig = {
        pattern,
        roleId: role.id,
        categoryId
      };

      // Obtém ou cria a lista de configurações para o servidor
      const guildConfigs = autoChannelAccessConfigs.get(interaction.guildId) || [];
      
      // Verifica se já existe uma configuração com o mesmo padrão e categoria
      const existingConfigIndex = guildConfigs.findIndex(
        config => config.pattern === pattern && config.categoryId === categoryId
      );

      if (existingConfigIndex >= 0) {
        // Atualiza a configuração existente
        guildConfigs[existingConfigIndex] = newConfig;
      } else {
        // Adiciona a nova configuração
        guildConfigs.push(newConfig);
      }

      // Salva a configuração
      autoChannelAccessConfigs.set(interaction.guildId, guildConfigs);

      // Salva as configurações no arquivo
      await saveConfigs();

      await interaction.editReply(
        `Acesso automático configurado:\n` +
        `• Padrão de nome: ${pattern}\n` +
        `• Cargo: ${role.name}\n` +
        `• Categoria: ${categoryName || 'Todas as categorias'}\n\n` +
        `Quando novos canais forem criados com o padrão especificado, o cargo ${role.name} receberá automaticamente permissão de visualização.`
      ).catch(error => console.error('Erro ao responder interação (timeout):', error));

    } catch (error) {
      console.error('Erro ao configurar auto-channel-access:', error);
      try {
        if (interaction.deferred) {
          await interaction.editReply('Ocorreu um erro ao configurar o acesso automático a canais.')
            .catch(replyError => console.error('Erro ao responder após falha (timeout):', replyError.code));
        } else {
          await interaction.reply('Ocorreu um erro ao configurar o acesso automático a canais.')
            .catch(replyError => console.error('Erro ao responder após falha (timeout):', replyError.code));
        }
      } catch (finalError) {
        console.error('Erro crítico ao responder interação:', finalError);
      }
    }
  }

  // ----------------------------------------------------------------------------
  // COMANDO /view-configs
  // ----------------------------------------------------------------------------
  if (interaction.commandName === 'view-configs') {
    try {
      await interaction.deferReply();

      const guildId = interaction.guildId;
      let configsText = `**📋 Configurações do Servidor**\n\n`;

      // Auto-Create Configs
      const autoCreate = autoCreateConfigs.get(guildId);
      if (autoCreate && Object.keys(autoCreate).length > 0) {
        configsText += `**🤖 Auto-Create:**\n`;
        for (const [event, config] of Object.entries(autoCreate)) {
          const category = interaction.guild.channels.cache.get(config.categoryId);
          const accessRole = config.accessRoleId ? interaction.guild.roles.cache.get(config.accessRoleId) : null;
          
          const eventName = {
            'member_join': 'Novo Membro',
            'role_create': 'Novo Cargo',
            'server_boost': 'Novo Boost'
          }[event] || event;

          configsText += `• **${eventName}**: ${config.namePattern} em ${category?.name || 'Categoria não encontrada'}\n`;
          configsText += `  - Privado: ${config.isPrivate ? 'Sim' : 'Não'}\n`;
          if (accessRole) configsText += `  - Cargo de acesso: ${accessRole.name}\n`;
        }
        configsText += `\n`;
      }

      // Auto-Category-Clone Config
      const categoryClone = autoCategoryCloneConfigs.get(guildId);
      if (categoryClone) {
        const categoryModel = interaction.guild.channels.cache.get(categoryClone.categoryModelId);
        const accessRole = categoryClone.accessRoleId ? interaction.guild.roles.cache.get(categoryClone.accessRoleId) : null;
        
        configsText += `**📂 Auto-Create-Category-Clone:**\n`;
        configsText += `• Categoria modelo: ${categoryModel?.name || 'Categoria não encontrada'}\n`;
        if (categoryClone.prefix) configsText += `• Prefixo: ${categoryClone.prefix}\n`;
        if (accessRole) configsText += `• Cargo adicional: ${accessRole.name}\n`;
        configsText += `\n`;
      }

      // Auto-Role Config
      const autoRole = autoRoleConfigs.get(guildId);
      if (autoRole) {
        const role = interaction.guild.roles.cache.get(autoRole.roleId);
        configsText += `**🎯 Auto-Role:**\n`;
        configsText += `• Cargo: ${role?.name || 'Cargo não encontrado'}\n\n`;
      }

      // Auto-Channel-Access Configs
      const channelAccess = autoChannelAccessConfigs.get(guildId);
      if (channelAccess && channelAccess.length > 0) {
        configsText += `**🔑 Auto-Channel-Access:**\n`;
        for (const config of channelAccess) {
          const role = interaction.guild.roles.cache.get(config.roleId);
          const category = config.categoryId ? interaction.guild.channels.cache.get(config.categoryId) : null;
          
          configsText += `• Padrão "${config.pattern}" → ${role?.name || 'Cargo não encontrado'}\n`;
          if (category) configsText += `  - Categoria: ${category.name}\n`;
        }
        configsText += `\n`;
      }

      // Se não há configurações
      if (configsText === `**📋 Configurações do Servidor**\n\n`) {
        configsText += `Nenhuma configuração ativa encontrada para este servidor.`;
      }

      await interaction.editReply(configsText);

    } catch (error) {
      console.error('Erro ao visualizar configurações:', error);
      if (interaction.deferred) {
        await interaction.editReply('Ocorreu um erro ao visualizar as configurações.');
      } else {
        await interaction.reply('Ocorreu um erro ao visualizar as configurações.');
      }
    }
  }
});

// ----------------------------------------------------------------------------
// EVENTO: NOVO MEMBRO
// ----------------------------------------------------------------------------
client.on('guildMemberAdd', async (member) => {
  try {
    // Verifica a configuração de auto-role para este servidor
    const autoRoleConfig = autoRoleConfigs.get(member.guild.id);
    if (autoRoleConfig) {
      try {
        const role = member.guild.roles.cache.get(autoRoleConfig.roleId);
        if (role) {
          await member.roles.add(role);
          console.log(`Cargo "${role.name}" adicionado automaticamente ao novo membro ${member.user.tag}.`);
        }
      } catch (roleError) {
        console.error(`Erro ao adicionar cargo automático ao membro ${member.user.tag}:`, roleError);
      }
    }

    // Verifica configuração de auto-create
    const guildConfigs = autoCreateConfigs.get(member.guild.id);
    if (guildConfigs && guildConfigs.member_join) {
      const config = guildConfigs.member_join;
      const counter = (member.guild.channels.cache
        .filter(ch => ch.parentId === config.categoryId)
        .size) + 1;

      // Prepara as permissões do canal
      const permissionOverwrites = [];
      
      if (config.isPrivate) {
        // Nega acesso para @everyone
        permissionOverwrites.push({
          id: member.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        });

        // Permite acesso para o membro
        permissionOverwrites.push({
          id: member.id,
          allow: [PermissionFlagsBits.ViewChannel],
        });

        // Se tiver cargo de acesso, permite para ele também
        if (config.accessRoleId) {
          permissionOverwrites.push({
            id: config.accessRoleId,
            allow: [PermissionFlagsBits.ViewChannel],
          });
        }
      }

      // Cria o canal
      const channelName = config.namePattern
        .replace('{name}', member.user.username.toLowerCase())
        .replace('{n}', counter.toString());

      await member.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: config.categoryId,
        permissionOverwrites,
      });
    }

    // Verifica configuração de auto-create-category-clone
    const categoryCloneConfig = autoCategoryCloneConfigs.get(member.guild.id);
    if (categoryCloneConfig) {
      // Busca a categoria modelo
      const categoryModel = member.guild.channels.cache.get(categoryCloneConfig.categoryModelId);
      if (!categoryModel) return;

      // Clona as permissões da categoria modelo
      const modelPermissions = categoryModel.permissionOverwrites.cache.toJSON();
      
      // Prepara as permissões da nova categoria
      const permissionOverwrites = [...modelPermissions];

      // Garante que o @everyone não tenha acesso (substitui a permissão existente se já existir)
      const everyoneIndex = permissionOverwrites.findIndex(perm => perm.id === member.guild.id);
      if (everyoneIndex >= 0) {
        permissionOverwrites[everyoneIndex] = {
          id: member.guild.id,
          deny: [...(permissionOverwrites[everyoneIndex].deny || []), PermissionFlagsBits.ViewChannel],
          allow: permissionOverwrites[everyoneIndex].allow || []
        };
      } else {
        permissionOverwrites.push({
          id: member.guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        });
      }

      // Garante que o novo membro tenha acesso
      const memberIndex = permissionOverwrites.findIndex(perm => perm.id === member.id);
      if (memberIndex >= 0) {
        permissionOverwrites[memberIndex] = {
          id: member.id,
          allow: [...(permissionOverwrites[memberIndex].allow || []), PermissionFlagsBits.ViewChannel],
          deny: permissionOverwrites[memberIndex].deny || []
        };
      } else {
        permissionOverwrites.push({
          id: member.id,
          allow: [PermissionFlagsBits.ViewChannel],
        });
      }

      // Garante que o cargo adicional tenha acesso, se configurado
      if (categoryCloneConfig.accessRoleId) {
        const roleIndex = permissionOverwrites.findIndex(perm => perm.id === categoryCloneConfig.accessRoleId);
        if (roleIndex >= 0) {
          permissionOverwrites[roleIndex] = {
            id: categoryCloneConfig.accessRoleId,
            allow: [...(permissionOverwrites[roleIndex].allow || []), PermissionFlagsBits.ViewChannel],
            deny: permissionOverwrites[roleIndex].deny || []
          };
        } else {
          permissionOverwrites.push({
            id: categoryCloneConfig.accessRoleId,
            allow: [PermissionFlagsBits.ViewChannel],
          });
        }
      }

      // Cria a nova categoria com o nome do membro
      const categoryName = `${categoryCloneConfig.prefix}${member.user.username}`;
      const newCategory = await member.guild.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory,
        permissionOverwrites,
      });

      // Lista todos os canais da categoria modelo
      const channelsInModel = member.guild.channels.cache.filter(
        ch => ch.parentId === categoryModel.id
      );

      // Clona todos os canais da categoria modelo, junto com suas permissões específicas
      for (const [, channel] of channelsInModel) {
        // Obtém as permissões específicas do canal modelo
        const channelPermissions = channel.permissionOverwrites.cache.toJSON();
        
        // Adiciona garantia de que o novo membro e o cargo de acesso terão permissão
        const channelPermissionOverwrites = [...channelPermissions];
        
        // Garante que o novo membro tenha acesso ao canal
        const memberChannelIndex = channelPermissionOverwrites.findIndex(perm => perm.id === member.id);
        if (memberChannelIndex >= 0) {
          channelPermissionOverwrites[memberChannelIndex] = {
            id: member.id,
            allow: [...(channelPermissionOverwrites[memberChannelIndex].allow || []), PermissionFlagsBits.ViewChannel],
            deny: channelPermissionOverwrites[memberChannelIndex].deny || []
          };
        } else {
          channelPermissionOverwrites.push({
            id: member.id,
            allow: [PermissionFlagsBits.ViewChannel],
          });
        }
        
        // Adiciona o cargo de acesso ao canal, se configurado
        if (categoryCloneConfig.accessRoleId) {
          const roleChannelIndex = channelPermissionOverwrites.findIndex(perm => perm.id === categoryCloneConfig.accessRoleId);
          if (roleChannelIndex >= 0) {
            channelPermissionOverwrites[roleChannelIndex] = {
              id: categoryCloneConfig.accessRoleId,
              allow: [...(channelPermissionOverwrites[roleChannelIndex].allow || []), PermissionFlagsBits.ViewChannel],
              deny: channelPermissionOverwrites[roleChannelIndex].deny || []
            };
          } else {
            channelPermissionOverwrites.push({
              id: categoryCloneConfig.accessRoleId,
              allow: [PermissionFlagsBits.ViewChannel],
            });
          }
        }
        
        await member.guild.channels.create({
          name: channel.name,
          type: channel.type,
          topic: channel.topic,
          nsfw: channel.nsfw,
          parent: newCategory.id,
          permissionOverwrites: channelPermissionOverwrites
        });
      }

      console.log(`Categoria "${categoryName}" criada para o membro ${member.user.tag} com ${channelsInModel.size} canais.`);
    }
  } catch (error) {
    console.error('Erro ao processar novo membro:', error);
  }
});

// Evento: Novo cargo
client.on('roleCreate', async (role) => {
  try {
    const guildConfigs = autoCreateConfigs.get(role.guild.id);
    if (!guildConfigs || !guildConfigs.role_create) return;

    const config = guildConfigs.role_create;
    const counter = (role.guild.channels.cache
      .filter(ch => ch.parentId === config.categoryId)
      .size) + 1;

    // Prepara as permissões do canal
    const permissionOverwrites = [];
    
    if (config.isPrivate) {
      // Nega acesso para @everyone
      permissionOverwrites.push({
        id: role.guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      });

      // Permite acesso para o novo cargo
      permissionOverwrites.push({
        id: role.id,
        allow: [PermissionFlagsBits.ViewChannel],
      });

      // Se tiver cargo de acesso adicional, permite para ele também
      if (config.accessRoleId) {
        permissionOverwrites.push({
          id: config.accessRoleId,
          allow: [PermissionFlagsBits.ViewChannel],
        });
      }
    }

    // Cria o canal
    const channelName = config.namePattern
      .replace('{name}', role.name.toLowerCase())
      .replace('{n}', counter.toString());

    await role.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: config.categoryId,
      permissionOverwrites,
    });

  } catch (error) {
    console.error('Erro ao criar canal automático para novo cargo:', error);
  }
});

// Evento: Novo boost
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  try {
    // Verifica se é um novo boost
    const boostedNow = !oldMember.premiumSince && newMember.premiumSince;
    if (!boostedNow) return;

    const guildConfigs = autoCreateConfigs.get(newMember.guild.id);
    if (!guildConfigs || !guildConfigs.server_boost) return;

    const config = guildConfigs.server_boost;
    const counter = (newMember.guild.channels.cache
      .filter(ch => ch.parentId === config.categoryId)
      .size) + 1;

    // Prepara as permissões do canal
    const permissionOverwrites = [];
    
    if (config.isPrivate) {
      // Nega acesso para @everyone
      permissionOverwrites.push({
        id: newMember.guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      });

      // Permite acesso para o booster
      permissionOverwrites.push({
        id: newMember.id,
        allow: [PermissionFlagsBits.ViewChannel],
      });

      // Se tiver cargo de acesso, permite para ele também
      if (config.accessRoleId) {
        permissionOverwrites.push({
          id: config.accessRoleId,
          allow: [PermissionFlagsBits.ViewChannel],
        });
      }
    }

    // Cria o canal
    const channelName = config.namePattern
      .replace('{name}', newMember.user.username.toLowerCase())
      .replace('{n}', counter.toString());

    await newMember.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: config.categoryId,
      permissionOverwrites,
    });

  } catch (error) {
    console.error('Erro ao criar canal automático para novo boost:', error);
  }
});

// ----------------------------------------------------------------------------
// EVENTO: CRIAÇÃO DE CANAL
// ----------------------------------------------------------------------------
client.on('channelCreate', async (channel) => {
  try {
    // Verifica se é um canal de texto
    if (channel.type !== ChannelType.GuildText) return;
    
    // Verifica se há configurações para o servidor
    const guildConfigs = autoChannelAccessConfigs.get(channel.guild.id);
    if (!guildConfigs || !guildConfigs.length) return;

    // Filtra as configurações aplicáveis a este canal
    const applicableConfigs = guildConfigs.filter(config => {
      // Verifica se está na categoria correta (se uma categoria foi especificada)
      if (config.categoryId && channel.parentId !== config.categoryId) {
        return false;
      }
      
      // Verifica se o nome do canal corresponde ao padrão
      return channel.name.includes(config.pattern);
    });

    // Para cada configuração aplicável, concede o acesso
    for (const config of applicableConfigs) {
      // Encontra o cargo
      const role = channel.guild.roles.cache.get(config.roleId);
      if (!role) continue;

      // Concede acesso ao cargo
      await channel.permissionOverwrites.edit(role.id, {
        ViewChannel: true
      });

      console.log(`Canal #${channel.name} criado: Acesso automático concedido para o cargo ${role.name}`);
    }
  } catch (error) {
    console.error('Erro ao processar canal recém-criado:', error);
  }
});

client.login(process.env.TOKEN);

