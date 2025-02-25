# Disparador de Mensagens Agendadas via WhatsApp  
Este é um software desenvolvido para agendar e enviar mensagens em massa via WhatsApp.   
Ele utiliza a biblioteca whatsapp-web.js para se conectar à API do WhatsApp Web e permite o envio de mensagens para uma lista de números de telefone carregados a partir de um arquivo .txt.  
  
# Funcionalidades  
Agendamento de Mensagens: Agende mensagens para serem enviadas em uma data e hora específicas.  
  
Envio em Massa: Envie mensagens para múltiplos números de telefone carregados a partir de um arquivo .txt.  
  
Interface Web: Interface amigável para gerenciar agendamentos, visualizar o status das mensagens e gerar QR Code para autenticação.  
  
Autenticação Local: Utiliza autenticação local para manter a sessão do WhatsApp ativa.  
  
# Pré-requisitos
Antes de começar, certifique-se de ter instalado:

Node.js  
https://nodejs.org/dist/v20.18.3/  

Git (opcional, para clonar o repositório)  
https://git-scm.com/downloads/win

Navegador moderno (Chrome, Firefox, Edge, etc.)

# Instalação
Siga os passos abaixo para configurar e executar o software:

1. Clonar o repositório (opcional)
Se você tiver o Git instalado, pode clonar o repositório:
```bash
git clone https://github.com/thiagociavolela/disparador_node.git
cd disparador_node
```
2. Instalar dependências
No diretório do projeto, instale as dependências necessárias:
```bash
npm install
```
3. Executar o projeto
Inicie o servidor com o seguinte comando:
```bash
node app.js
```

4. Acessar seu local.  
O servidor estará disponível em http://localhost:3000  
  
# Como Usar
### 1. Autenticação no WhatsApp  
Ao acessar a interface web, você verá um QR Code. Escaneie-o com o aplicativo do WhatsApp no seu celular para autenticar a sessão.  
  
### 2. Agendar Mensagens  
Mensagem: Digite a mensagem que deseja enviar.  
Arquivo de Números: Carregue um arquivo .txt contendo os números de telefone (um por linha).  
Data e Hora: Selecione a data e hora para o envio da mensagem.  
Clique em "Agendar" para programar o envio.  
  
### 3. Visualizar Agendamentos  
Na tabela de mensagens agendadas, você pode ver o status de cada mensagem (Agendado, Enviado, etc.).  
  
### 4. Desconectar  
Se desejar desconectar o dispositivo, clique em "Desconectar". Isso encerrará a sessão do WhatsApp.  
