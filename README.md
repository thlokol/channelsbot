# Bot Discord - Gerenciador de Canais e Automações

Um bot Discord para gerenciamento automatizado de canais, categorias e permissões com sistema de configurações persistentes.

## 📋 Funcionalidades Principais

### 🏗️ Gerenciamento de Canais
- **Criação de Categorias**: Crie categorias com múltiplos canais e permissões personalizadas
- **Clonagem de Categorias**: Clone categorias inteiras com todos os canais e permissões
- **Renomeação em Massa**: Renomeie múltiplos canais de uma vez
- **Exclusão de Categorias**: Delete categorias inteiras com confirmação de segurança

### 🤖 Automações Inteligentes
- **Auto-Create**: Criação automática de canais baseada em eventos (novos membros, cargos, boosts)
- **Auto-Category-Clone**: Clonagem automática de categorias para novos membros
- **Auto-Role**: Atribuição automática de cargos para novos membros
- **Auto-Channel-Access**: Concessão automática de permissões baseada em padrões de nomes

### 💾 Sistema de Persistência
- **Configurações Permanentes**: Todas as configurações são mantidas após reiniciar o bot
- **Carregamento Automático**: Restaura automaticamente todas as configurações ao iniciar
- **Backup Simples**: Arquivo JSON facilita backup e restauração

## ⚙️ Instalação e Configuração

### Pré-requisitos
- Node.js 16.0+ 
- npm ou yarn
- Bot Discord configurado no Discord Developer Portal

### Configuração Inicial

1. **Clone ou baixe os arquivos do bot**

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` com:
   ```
   TOKEN=seu_token_do_bot
   CLIENT_ID=id_do_seu_bot
   ```

4. **Registre os comandos:**
   ```bash
   node deploy-commands.js
   ```

5. **Inicie o bot:**
   ```bash
   node index.js
   ```

## 🎮 Comandos Disponíveis

### 📁 Gerenciamento de Canais

#### `/create`
Cria uma categoria com múltiplos canais e permissões personalizadas.

**Parâmetros:**
- `categoria` (obrigatório): Nome da categoria
- `canais` (obrigatório): Nomes dos canais separados por espaço
- `cargo1-5` (opcional): Até 5 cargos com acesso
- `user1-5` (opcional): Até 5 usuários com acesso

**Exemplo:**
```
/create categoria:Projeto-Alpha canais:geral discussões arquivos cargo1:@Desenvolvedores
```

#### `/clone-category`
Clona uma categoria existente com todos os canais e permissões.

**Parâmetros:**
- `categoria_origem` (obrigatório): Nome da categoria a ser clonada
- `clonar_permissoes` (obrigatório): Se deve clonar as permissões
- `confirmar` (obrigatório): Confirmação da operação
- `categoria_destino` (opcional): Nome da nova categoria

**Exemplo:**
```
/clone-category categoria_origem:Projeto-Alpha clonar_permissoes:True confirmar:True categoria_destino:Projeto-Beta
```

#### `/delete-category`
Deleta uma categoria e todos os seus canais.

**Parâmetros:**
- `categoria` (obrigatório): Nome da categoria a ser deletada
- `confirmar` (obrigatório): Confirmação da operação

**Exemplo:**
```
/delete-category categoria:Projeto-Alpha confirmar:True
```

#### `/channel-rename`
Renomeia múltiplos canais de uma vez.

**Parâmetros:**
- `buscar` (obrigatório): Nome ou parte do nome dos canais
- `novo_nome` (obrigatório): Novo padrão de nome (use `{n}` para numeração)
- `confirmar` (obrigatório): Confirmação da operação
- `categoria` (opcional): Filtrar por categoria específica

**Exemplo:**
```
/channel-rename buscar:temp novo_nome:arquivo-{n} confirmar:True categoria:Documentos
```

#### `/channelvisible`
Concede permissão de visualização para cargos em canais específicos.

**Parâmetros:**
- `channelname` (obrigatório): Nome exato dos canais
- `cargo1-5` (opcional): Até 5 cargos que receberão acesso

### 🤖 Comandos de Automação

#### `/auto-create`
Configura criação automática de canais baseada em eventos.

**Parâmetros:**
- `evento` (obrigatório): Tipo de evento (Novo Membro/Cargo/Boost)
- `categoria` (obrigatório): Categoria onde criar os canais
- `padrao_nome` (obrigatório): Padrão do nome (`{name}` = nome, `{n}` = número)
- `privado` (obrigatório): Se o canal deve ser privado
- `ativar` (obrigatório): Ativar ou desativar
- `cargo_acesso` (opcional): Cargo com acesso adicional

**Exemplo:**
```
/auto-create evento:Novo Membro categoria:Membros padrao_nome:{name}-area privado:True ativar:True cargo_acesso:@Staff
```

#### `/auto-create-category-clone`
Configura clonagem automática de categorias para novos membros.

**Parâmetros:**
- `categoria_modelo` (obrigatório): Categoria que serve como modelo
- `ativar` (obrigatório): Ativar ou desativar
- `cargo_acesso` (opcional): Cargo adicional com acesso
- `prefixo` (opcional): Prefixo para o nome da categoria

**Exemplo:**
```
/auto-create-category-clone categoria_modelo:Template-Membro ativar:True prefixo:Área de
```

#### `/auto-role`
Configura atribuição automática de cargo para novos membros.

**Parâmetros:**
- `cargo` (obrigatório): Cargo a ser atribuído
- `ativar` (obrigatório): Ativar ou desativar

**Exemplo:**
```
/auto-role cargo:@Membro ativar:True
```

#### `/auto-channel-access`
Configura acesso automático a canais baseado em padrões de nome.

**Parâmetros:**
- `padrao_nome` (obrigatório): Padrão de nome dos canais
- `cargo` (obrigatório): Cargo que receberá acesso
- `ativar` (obrigatório): Ativar ou desativar
- `categoria` (opcional): Categoria específica onde aplicar

**Exemplo:**
```
/auto-channel-access padrao_nome:suporte cargo:@Staff ativar:True categoria:Atendimento
```

### 📊 Visualização

#### `/view-configs`
Visualiza todas as configurações ativas do servidor.

**Parâmetros:** Nenhum

**Exemplo:**
```
/view-configs
```

## 🔧 Sistema de Persistência

### Como Funciona
- **Arquivo de Configurações**: `bot-configs.json`
- **Carregamento Automático**: Configurações são carregadas quando o bot inicia
- **Salvamento Automático**: Configurações são salvas automaticamente sempre que modificadas

### Arquivo de Configurações

O arquivo `bot-configs.json` é criado automaticamente e contém todas as configurações estruturadas por servidor:

```json
{
  "autoCreateConfigs": [
    ["123456789", {
      "member_join": {
        "categoryId": "987654321",
        "namePattern": "{name}-area",
        "accessRoleId": "111111111",
        "isPrivate": true
      }
    }]
  ],
  "autoRoleConfigs": [
    ["123456789", {
      "roleId": "222222222"
    }]
  ],
  "autoCategoryCloneConfigs": [
    ["123456789", {
      "categoryModelId": "333333333",
      "accessRoleId": "444444444",
      "prefix": "Área de "
    }]
  ],
  "autoChannelAccessConfigs": [
    ["123456789", [{
      "pattern": "suporte",
      "roleId": "555555555",
      "categoryId": null
    }]]
  ]
}
```

### Vantagens

✅ **Persistência Total**: Configurações nunca são perdidas  
✅ **Carregamento Automático**: Sem necessidade de reconfigurar após reiniciar  
✅ **Backup Fácil**: Arquivo JSON pode ser facilmente copiado/restaurado  
✅ **Performance**: Sistema otimizado usando Maps em memória  

## 🔒 Permissões Necessárias

O bot precisa das seguintes permissões no Discord:

- **Gerenciar Canais**: Para criar, editar e deletar canais/categorias
- **Gerenciar Cargos**: Para atribuição automática de cargos (apenas auto-role)
- **Ver Canais**: Para acessar e modificar permissões
- **Gerenciar Permissões**: Para alterar permissões de canais

## 🆘 Solução de Problemas

### Bot não responde aos comandos
1. Verifique se o bot está online
2. Confirme se os comandos foram registrados (`node deploy-commands.js`)
3. Verifique as permissões do bot no servidor

### Configurações perdidas após reiniciar
1. Verifique se o arquivo `bot-configs.json` existe
2. Confira se há erros no console durante o carregamento
3. Verifique permissões de escrita na pasta do bot

### Comandos não aparecem
1. Aguarde até 1 hora (comandos globais podem demorar)
2. Execute `node deploy-commands.js` novamente
3. Verifique se o CLIENT_ID está correto

## 📄 Licença

Este projeto está sob a licença ISC.

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests. 