import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installError, setInstallError] = useState("");
  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const sync = () =>
      setInstalled(
        media.matches ||
          Boolean(
            (navigator as Navigator & { standalone?: boolean }).standalone,
          ),
      );
    const capture = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const done = () => {
      setInstalled(true);
      setPrompt(null);
    };
    sync();
    media.addEventListener("change", sync);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", done);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  async function install() {
    if (!prompt) return;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      setInstallError(
        "Não foi possível abrir a instalação. Use o menu do navegador.",
      );
    } finally {
      setPrompt(null);
    }
  }
  return (
    <section className="install-panel" aria-labelledby="install-title">
      <div>
        <h2 id="install-title">Leve a calculadora com você</h2>
        <p>
          {installed
            ? "O aplicativo está aberto no modo instalado."
            : "Instale no celular ou computador para abrir direto pelo ícone."}
        </p>
        <p className="offline-status" role="status">
          {offlineReady
            ? "✓ Calculadora preparada para uso offline neste dispositivo."
            : "Para usar offline, abra a versão publicada com internet e aguarde a preparação. No modo de desenvolvimento, o offline não é ativado."}
        </p>
      </div>
      {prompt && !installed && (
        <button type="button" onClick={install}>
          Instalar aplicativo
        </button>
      )}
      {!installed && (
        <details>
          <summary>Como instalar no meu aparelho?</summary>
          <p>
            <strong>Android:</strong> abra o endereço publicado no Chrome. Use
            “Instalar aplicativo” quando disponível ou procure “Adicionar à tela
            inicial” no menu.
          </p>
          <p>
            <strong>iPhone e iPad:</strong> abra no Safari, toque em
            Compartilhar e em “Adicionar à Tela de Início”. Os nomes podem
            variar por versão.
          </p>
          <p>
            <strong>Computador:</strong> em navegadores compatíveis, procure o
            ícone de instalação na barra de endereço ou a opção de instalar no
            menu.
          </p>
          <p>
            A instalação depende do navegador e de um endereço publicado com
            HTTPS. O endereço localhost do computador não é acessível
            diretamente no celular. Seus valores ainda não são salvos ao fechar.
          </p>
        </details>
      )}
      {installError && <p role="status">{installError}</p>}
      {needRefresh && (
        <div className="update-message" role="status">
          <p>
            Uma nova versão está disponível. Atualizar recarrega a página e
            restaura os valores de exemplo. Anote sua simulação antes.
          </p>
          <button type="button" onClick={() => void updateServiceWorker(true)}>
            Atualizar agora
          </button>
        </div>
      )}
    </section>
  );
}
