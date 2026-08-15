import { useState } from 'react';
import type { TitanPlan } from '../plan/types';

type ExportStatus = 'idle' | 'sharing' | 'shared' | 'downloaded' | 'cancelled' | 'error';
type ShareCapableNavigator = Navigator & {
  canShare?: (data?: { files?: File[] }) => boolean;
  share?: (data?: { files?: File[]; title?: string; text?: string }) => Promise<void>;
};

export function serializeTrainingPlan(plan: TitanPlan) {
  return JSON.stringify(plan, null, 2);
}

export function buildTrainingExportFilename(plan: TitanPlan, date = new Date()) {
  const safeId = String(plan.id || 'treino-atual').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/^-+|-+$/g, '') || 'treino-atual';
  const stamp = date.toISOString().slice(0, 10);
  return `TITAN-TREINO-${safeId}-${stamp}.json`;
}

export function TrainingPlanExport({ plan }: { plan: TitanPlan }) {
  const [status, setStatus] = useState<ExportStatus>('idle');

  async function handleExport() {
    setStatus('sharing');
    const filename = buildTrainingExportFilename(plan);
    const payload = serializeTrainingPlan(plan);
    const file = new File([payload], filename, { type: 'application/json' });
    const shareNavigator = navigator as ShareCapableNavigator;

    try {
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
      if (error instanceof DOMException && error.name === 'AbortError') {
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
    {status === 'shared' && <small className="programming-export-status success">Arquivo compartilhado.</small>}
    {status === 'downloaded' && <small className="programming-export-status success">Arquivo salvo. Agora você pode enviar o JSON para revisão.</small>}
    {status === 'cancelled' && <small className="programming-export-status">Compartilhamento cancelado.</small>}
    {status === 'error' && <small className="programming-export-status error">Não foi possível exportar. Tente novamente.</small>}
  </section>;
}
