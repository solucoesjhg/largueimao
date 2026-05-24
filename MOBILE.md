# Guia Mobile: Larguei Mão 📱

Este projeto é híbrido. Ele utiliza **React + Vite** para a interface (Web) e **Capacitor** para encapsular e fornecer acesso aos recursos nativos do celular.

## Comandos Principais

Sempre que você alterar o código React (Frontend) e quiser testar no mobile, você precisa gerar o pacote e sincronizar com as pastas nativas:

```bash
bun run build:mobile
```
> *Esse comando fará o `vite build` e depois o `npx cap sync`, copiando a nova interface para dentro das pastas `ios/` e `android/`.*

---

## 🍏 Como rodar no iOS (Mac Necessário)

O Capacitor gera um projeto Xcode real. Para abrir:

```bash
npx cap open ios
```

1. O **Xcode** irá abrir com o projeto `App.xcworkspace`.
2. Conecte seu iPhone via cabo ou escolha um Simulador no topo.
3. Clique no botão de **Play ▶️** (ou `Cmd + R`).

*Nota: Permissões de câmera, galeria e localização já estão mapeadas no `Info.plist` com as traduções em português.*

---

## 🤖 Como rodar no Android

O Capacitor gera um projeto Android Studio real. Para abrir:

```bash
npx cap open android
```

1. O **Android Studio** irá abrir e rodar o Gradle Sync automaticamente.
2. Conecte seu Android via cabo (com Depuração USB ativada) ou abra o emulador local.
3. Clique no botão de **Play ▶️** (ou `Shift + F10`).

*Nota: Permissões de câmera, armazenamento e localização já estão declaradas no `AndroidManifest.xml`.*

---

## 🔌 Plugins Nativos Ativos na Estrutura

Instalamos a fundação para integrações nativas futuras:
- `@capacitor/camera`: Permite chamar a câmera nativa do celular direto no `PostItem.tsx`.
- `@capacitor/geolocation`: Permite buscar coordenadas (GPS do celular).
- `@capacitor/splash-screen` e `@capacitor/status-bar`: Permite controlar a cor do relógio do celular e a tela de abertura.
- `@capacitor/app`: Para lidar com deep links futuramente.
