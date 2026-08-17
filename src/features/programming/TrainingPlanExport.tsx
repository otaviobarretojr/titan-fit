import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import type { TitanPlan } from '../plan/types';
import { buildTrainingExportFilename, serializeTrainingPlan } from './trainingPlanExport';

type ExportStatus = 'idle' | 'sharing' | 'shared' | 'downloaded' | 'cancelled' | 'error';

type ShareCapableNavigator = Navigator & {
  canShare?: (data?: { files?: File[] }) => boolean;
  share?: (data?: { files?: File[]; title?: string; text?: string }) => Promise<void>;
};

export function TrainingPlanExport({ plan }: { plan: TitanPlan }) {
  const [status, setStatus] = useState<ExportStatus>('idle');

  async function handleExport() {
    setStatus('sharing');
    const filename = buildTrainingExportFilename(plan);
    const payload = serializeTrainingPlan(plan);

    try {
      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.writeFile({
          path: filename,
          data: payload,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
          recursive: true
        });

        await Share.share({
          title: 'TITAN FIT — Treino atual',
          text: 'Projeto de treino atual exportado pelo TITAN FIT para revisão e futura reimportação.',
          url: result.uri,
          dialogTitle: 'Compartilhar treino do TITAN FIT'
        });
        setStatus('shared');
        return;
      }

      const file = new File([payload], filename, { type: 'application/json' });
      const shareNavigator = navigator as ShareCapableNavigator;
      if (shareNavigator.share && shareNavigator.canShare?.({ files: [file] })) {
        await shareNavigator.share({
          files: [file],
          title: 'TITAN FIT — Treino atual',
          text: 'Projeto de treino atual exportado pelo TITAN FIT para revisão e futura reimportação.'
        });
        setStatus('shared');
        return;
      }

      const url = URL.createObjectURL(file);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus('downloaded');
    } catch (error) {
      const name = error instanceof DOMException ? error.name : error instanceof Error ? error.name : '';
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (name === 'AbortError' || message.includes('cancel')) {
        setStatus('cancelled');
        return;
      }
      console.error('Falha ao exportar treino atual', error);
      setStatus('error');
    }
  }

  return <section className="programming-export-card" aria-label="Exportar treino atual">
    <div className="programming-export-copy">
      <span className="eyebrow">ARQUIVO DO PROJETO</span>
      <strong>Exportar treino atual</strong>
      <p>Gera um JSON compatível com o TITAN FIT, sem histórico, fotos ou dados de saúde.</p>
    </div>
    <button type="button" className="secondary-action programming-export-action" disabled={status === 'sharing'} onClick={handleExport}>
      {status === 'sharing' ? 'Preparando…' : 'Exportar treino'}
    </button>
    {status === 'shared' && <small className="programming-export-status success">Arquivo criado e enviado para compartilhamento.</small>}
    {status === 'downloaded' && <small className="programming-export-status success">Arquivo salvo. Agora você pode enviar o JSON para revisão.</small>}
    {status === 'cancelled' && <small className="programming-export-status">Compartilhamento cancelado. Toque em exportar quando quiser tentar novamente.</small>}
    {status === 'error' && <small className="programming-export-status error">Não foi possível gerar o arquivo. Tente novamente.</small>}
  </section>;
}
