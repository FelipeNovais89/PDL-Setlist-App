# PDL Setlist — PWA

Progressive Web App para gerenciar setlists de pagode. Converte o app Streamlit original em um PWA instalável no celular.

## Funcionalidades

- **Home** — criar nova setlist ou carregar existente do GitHub
- **Editor** — estrutura em blocos/itens, arrastar para reordenar (dnd-kit)
- **Preview de cifra** — exibe cifra com transposição de tom em tempo real
- **Banco de músicas** — tabela editável salva como CSV no GitHub
- **OCR de cifras** — upload de imagem → Gemini AI transcreve a cifra
- **Fullscreen slides** — swipe horizontal entre músicas (modo apresentação)
- **Export PDF** — página atual ou setlist inteira (pdf-lib)
- **PWA / offline** — service worker com cache das cifras já carregadas

---

## 1. Configuração do `.env`

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `VITE_GITHUB_TOKEN` | Personal Access Token com escopo `repo` |
| `VITE_GITHUB_OWNER` | Usuário/org do repositório de dados |
| `VITE_GITHUB_REPO` | Nome do repositório (ex: `PDLSetlist`) |
| `VITE_GITHUB_BRANCH` | Branch principal (padrão: `main`) |
| `VITE_GITHUB_SETLISTS_DIR` | Pasta de setlists (padrão: `Data/Setlists`) |
| `VITE_SONGS_CSV_URL` | URL raw do CSV do banco de músicas |
| `VITE_GEMINI_API_KEY` | Chave da API do Google AI Studio |
| `VITE_DRIVE_FOLDER_ID` | ID da pasta no Google Drive (opcional) |
| `VITE_DRIVE_RELAY_URL` | URL do seu deploy Vercel (ver seção abaixo) |

---

## 2. Configurar o Service Account do Google Drive

O browser não pode usar service accounts diretamente. Por isso há um relay
em `api/drive-read.ts` e `api/drive-write.ts` (Vercel Edge Functions).

### Passo a passo

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto → ative a **Google Drive API**
3. Em **IAM & Admin → Service Accounts**, crie uma conta de serviço
4. Baixe a chave JSON (tipo `PKCS8 / JSON`)
5. No Vercel (próxima seção), adicione as variáveis:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL = sua-conta@projeto.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_KEY   = -----BEGIN PRIVATE KEY-----\nMII...
```

> **Importante:** no campo `GOOGLE_SERVICE_ACCOUNT_KEY`, cole a chave privada
> do JSON (`private_key`) substituindo as quebras de linha reais por `\n`.

6. Compartilhe a pasta/arquivo do Drive com o e-mail da service account
   (ao menos permissão de **Viewer** para leitura, **Editor** para escrita).

---

## 3. Deploy no Vercel (recomendado)

```bash
# Instale a CLI do Vercel
npm i -g vercel

# Dentro da pasta do projeto
vercel

# Nas variáveis de ambiente do projeto Vercel, adicione tudo do .env
# mais as variáveis do Google (GOOGLE_SERVICE_ACCOUNT_EMAIL / KEY)
```

O `vercel.json` já está configurado para rodar as Edge Functions em `/api/`
e redirecionar tudo mais para o `index.html` (SPA).

Após o deploy, copie a URL do projeto (ex: `https://pdl-setlist.vercel.app`)
e adicione em `VITE_DRIVE_RELAY_URL` no `.env` do próximo build.

---

## 4. Rodar localmente

```bash
npm install
cp .env.example .env   # edite com seus tokens
npm run dev            # http://localhost:3000
```

---

## 5. Instalar no celular (Add to Home Screen)

### Android (Chrome)
1. Abra o app no Chrome
2. Menu (⋮) → **Adicionar à tela inicial**

### iOS (Safari)
1. Abra o app no Safari
2. Botão de Compartilhar → **Adicionar à Tela de Início**

O app abre em modo standalone (sem barra de endereço), como um app nativo.

---

## 6. Estrutura do projeto

```
src/
├── lib/
│   ├── transpose.ts    # transposição de acordes (portado do Python)
│   ├── github.ts       # leitura/escrita de CSVs no GitHub
│   ├── drive.ts        # leitura/escrita de cifras no Drive (via relay)
│   ├── gemini.ts       # OCR via Gemini 2.0 Flash
│   └── pdf.ts          # geração de PDF com pdf-lib
├── store/
│   ├── useSetlistStore.ts   # estado dos blocos e itens
│   └── useSongsStore.ts     # banco de músicas
├── components/
│   ├── preview/
│   │   ├── SheetPage.tsx        # layout da cifra (reproduz o HTML original)
│   │   └── FullscreenSlides.tsx # swipe viewer com fullscreen API
│   ├── setlist/
│   │   ├── BlockCard.tsx
│   │   ├── SongItem.tsx
│   │   ├── PauseItem.tsx
│   │   └── SongPickerModal.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── DataTable.tsx
├── pages/
│   ├── HomePage.tsx
│   ├── EditorPage.tsx
│   ├── SongDatabasePage.tsx
│   └── OcrPage.tsx
api/
├── drive-read.ts   # Vercel Edge Function — lê arquivo do Drive
└── drive-write.ts  # Vercel Edge Function — salva arquivo no Drive
```

---

## Formato dos arquivos

### Setlist CSV (em `Data/Setlists/`)

```
BlockIndex,BlockName,ItemIndex,ItemType,SongTitle,Artist,Tom,BPM,
CifraDriveID,CifraSimplificadaID,UseSimplificada,PauseLabel,Obs,Preparacao
```

### Banco de músicas CSV (`Data/PDL_musicas.csv`)

```
Título,Artista,Tom_Original,BPM,CifraDriveID,CifraSimplificadaID
```

### Formato da cifra (TXT no Drive)

- Linhas **sem prefixo** = letra da música
- Linhas **com `|` no início** = linha de acordes (serão transpostos)

```
[Verso 1]
|Am     G       F
Linha de letra aqui
|C      Em      Dm
Outra linha...
```
