# Android Build Instructions

Este projeto usa Capacitor para gerar o APK Android do EcoVerify.

## Build Local

### Pré-requisitos
- Node.js 20+
- Java 17
- Android SDK
- Capacitor CLI

### Passos para build local

1. Instale as dependências:
```bash
npm install
```

2. Configure a URL HTTPS real do servidor Next.js:
```bash
export CAPACITOR_SERVER_URL="https://seu-dominio-de-producao.example"
```

3. Sincronize o projeto Android:
```bash
npx cap sync android
```

4. Build do APK debug:
```bash
cd android
./gradlew assembleDebug
```

O APK debug será gerado em: `android/app/build/outputs/apk/debug/app-debug.apk`

### Build de Release (Assinado)

Para distribuir o APK, você precisa assiná-lo com um keystore:

1. Gere um keystore:
```bash
keytool -genkey -v -keystore release.keystore -alias ecoverify -keyalg RSA -keysize 2048 -validity 10000
```

2. Configure o keystore no `android/app/build.gradle`:
```gradle
android {
    signingConfigs {
        release {
            storeFile file('release.keystore')
            storePassword 'your-store-password'
            keyAlias 'ecoverify'
            keyPassword 'your-key-password'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

3. Build do APK release:
```bash
cd android
./gradlew assembleRelease
```

O APK release será gerado em: `android/app/build/outputs/apk/release/app-release.apk`

## GitHub Actions Build

O projeto tem um workflow automatizado que constrói o APK no GitHub Actions.

### Ativar build automatizado de release

Para construir APKs assinados automaticamente:

1. Gere um keystore conforme acima
2. Converta o keystore para base64:
```bash
base64 release.keystore > keystore.base64
```

3. Adicione os secrets no GitHub (Settings > Secrets and variables > Actions):
   - `KEYSTORE_FILE_BASE64`: Conteúdo do arquivo keystore.base64
   - `KEYSTORE_PASSWORD`: Senha do keystore
   - `KEY_ALIAS`: Alias do keystore (ex: ecoverify)
   - `KEY_PASSWORD`: Senha da chave

4. Configure o `android/app/build.gradle` para usar os secrets (se necessário)

### Build Debug Automatizado

O workflow sempre constrói APKs debug sem necessidade de secrets.

### Baixar o APK

Após o build:
1. Vá em Actions tab no GitHub
2. Selecione o workflow run
3. Baixe o artifact do APK desejado

## Configuração de Produção

Antes de build de produção:

1. Configure `CAPACITOR_SERVER_URL` com a URL HTTPS real do servidor Next.js
2. Configure `DATABASE_URL` somente no ambiente do servidor Next.js
3. Configure o banco de dados de produção
4. Teste completamente em ambiente de staging

## Segurança

- Nunca commit keystores ou senhas
- Use GitHub Secrets para dados sensíveis
- Mantenha o keystore em local seguro
- Use senhas fortes para o keystore