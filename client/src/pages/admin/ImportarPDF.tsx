import { AppLayout } from "@/components/AppLayout";
import { RequireAuth } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
 import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  FileUp,
  UploadCloud,
  FileCheck2,
  AlertCircle,
  ShieldCheck,
  GraduationCap,
  Building2,
} from "lucide-react";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { extractPdfText } from "@/lib/pdf";
import {
  parseImportText,
  markDuplicateStudents,
  type ParsedStudent,
} from "@shared/pdfParser";

export default function AdminImportarPDF() {
  return (
    <RequireAuth perfil="ADMIN">
      <AppLayout>
        <ImportarPDFContent />
      </AppLayout>
    </RequireAuth>
  );
}

function ImportarPDFContent() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedEscola, setSelectedEscola] = useState<{ id: number; nome: string } | null>(null);
  const [escolas, setEscolas] = useState<Array<{ id: number; nome: string }>>([]);
  const [reading, setReading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<ParsedStudent[]>([]);
  const [detectedEscola, setDetectedEscola] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.listSchools().then((all) => setEscolas(all as Array<{ id: number; nome: string }>));
  }, []);

  const readFile = async () => {
    if (!file) return;
    setReading(true);
    setError("");

    try {
      const raw = await extractPdfText(file, (page, total) =>
        setProgress(Math.round((page / total) * 100))
      );

      const parsed = parseImportText(raw);
      setDetectedEscola(parsed.escola);

      let students = parsed.alunos;
      let escolaFinal = parsed.escola;

      if (selectedEscola) {
        escolaFinal = selectedEscola.nome;
      } else if (parsed.escola) {
        const match = escolas.find(
          (e) =>
            e.nome.toLowerCase().replace(/\s+/g, " ") ===
            parsed.escola.toLowerCase().replace(/\s+/g, " ")
        );
        if (!match) {
          setError(
            `Escola "${parsed.escola}" identificada no PDF não está cadastrada. Selecione uma escola manualmente.`
          );
        }
      }

      const schoolRow = selectedEscola ??
        escolas.find(
          (e) =>
            e.nome.toLowerCase().replace(/\s+/g, " ") ===
            escolaFinal.toLowerCase().replace(/\s+/g, " ")
        );

      if (!schoolRow) {
        setError(
          "Não foi possível associar o PDF a uma escola cadastrada. Selecione uma escola antes de importar."
        );
        setReading(false);
        return;
      }

      const { data: existing } = await supabase
        .from("alunos")
        .select("matricula, inep")
        .eq("escola_id", schoolRow.id);

      students = markDuplicateStudents(students, existing ?? []);
      setPreview(students);
    } catch {
      setError("Não foi possível ler este PDF. Confirme se o arquivo contém texto selecionável.");
    } finally {
      setReading(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedEscola && !detectedEscola) return;

    const schoolName = selectedEscola?.nome ?? detectedEscola;
    if (!schoolName) return;

    try {
      const result = await api.confirmStudentImport({
        escola: schoolName,
        students: preview.filter((s) => s.nome && s.turma && s.matricula).map(s => ({
          nome: s.nome,
          inep: s.inep || undefined,
          turma: s.turma,
          matricula: s.matricula,
          dataMatricula: s.dataMatricula || undefined,
          filiacao1: s.filiacao1 || undefined,
          filiacao2: s.filiacao2 || undefined,
          responsavel: s.responsavel || undefined,
          fone1: s.fone1 || undefined,
          fone2: s.fone2 || undefined,
          endereco: s.endereco || undefined,
        })),
      });

      setPreview([]);
      setFile(null);
      setDetectedEscola("");
      setProgress(0);
      alert(`${result.inserted} alunos importados; ${result.skipped} registros ignorados.`);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar importação.");
    }
  };

  const reset = () => {
    setPreview([]);
    setFile(null);
    setDetectedEscola("");
    setProgress(0);
    setError("");
  };

  if (reading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-6">
        <div className="text-center">
          <UploadCloud className="mx-auto h-10 w-10 text-blue-600" />
          <h3 className="mt-4 text-lg font-semibold">Lendo PDF...</h3>
          <p className="text-sm text-muted-foreground">
            Processando página {Math.round(progress / (100 / 30))} de 30
          </p>
        </div>
        <Progress value={progress} className="w-64" />
      </div>
    );
  }

  return (
    <div className="section-stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">GESTÃO</p>
          <h2>Importar alunos por PDF</h2>
          <p className="muted-copy">
            Leia o relatório escolar, revise os dados e salve. Nada é gravado
            antes da confirmação.
          </p>
        </div>
      </div>

      {preview.length === 0 && (
        <Card className="import-card">
          <CardContent className="p-0">
            <div className="import-dropzone">
              <div className="upload-visual">
                <FileUp className="h-7 w-7" />
              </div>
              <h3>Importe um relatório em PDF</h3>
              <p>
                O sistema identifica a escola e separa cada aluno por bloco,
                sem misturar informações.
              </p>

              <div className="file-picker" onClick={() => document.getElementById("pdf-input")?.click()}>
                <Input
                  id="pdf-input"
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="hidden"
                />
                <strong>Selecionar PDF</strong>
                <span>PDF até 25 MB · leitura de todas as páginas</span>
              </div>

              <div className="import-steps">
                <div>
                  <span>01</span>
                  <div>
                    <strong>Leitura segura</strong>
                    <p>Extração por campos e blocos independentes.</p>
                  </div>
                </div>
                <div>
                  <span>02</span>
                  <div>
                    <strong>Validação</strong>
                    <p>Alertas, duplicidades e dados ausentes são sinalizados.</p>
                  </div>
                </div>
                <div>
                  <span>03</span>
                  <div>
                    <strong>Confirmação</strong>
                    <p>Nada é gravado antes da sua aprovação.</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedEscola && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
          <Building2 className="h-4 w-4 text-indigo-600" />
          <span className="text-sm font-medium">
            ESCOLA SELECIONADA:
          </span>
          <span className="text-sm">{selectedEscola.nome}</span>
        </div>
      )}

      {!selectedEscola && (
        <div className="space-y-2">
          <Label>Selecione a escola</Label>
          <select
            className="w-full cursor-pointer rounded-lg border px-3 py-2"
            value={selectedEscola ? String((selectedEscola as any).id) : ""}
            onChange={(e) => {
              const esc = escolas.find((s) => s.id === Number(e.target.value)) ?? null;
              setSelectedEscola(esc);
            }}
          >
            <option value="">Escolha a escola</option>
            {escolas.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      {file && preview.length === 0 && !reading && (
        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-sm">{file.name}</span>
          <Button onClick={readFile} className="primary-button">
            Processar PDF
          </Button>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {preview.length > 0 && (
        <ImportPreview
          file={file}
          escola={selectedEscola?.nome ?? detectedEscola}
          preview={preview}
          onConfirm={handleConfirm}
          onCancel={reset}
        />
      )}
    </div>
  );
}

function ImportPreview({
  file,
  escola,
  preview,
  onConfirm,
  onCancel,
}: {
  file: File | null;
  escola: string;
  preview: ParsedStudent[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const errosCount = preview.filter((s) => s.status === "ERRO").length;
  const atencaoCount = preview.filter((s) => s.status === "ATENCAO").length;
  const okCount = preview.filter((s) => s.status === "OK").length;

  return (
    <Card className="table-card">
      <CardHeader>
        <CardTitle>Conferir importação</CardTitle>
        <CardDescription>
          <p>Arquivo: {file?.name || "N/D"}</p>
          <p>Escola: {escola}</p>
          <p>Alunos encontrados: {preview.length}</p>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4">
          <Badge className="status-badge success">
            <span /> OK: {okCount}
          </Badge>
          <Badge className="status-badge warning">
            <span /> Atenção: {atencaoCount}
          </Badge>
          <Badge className="status-badge error">
            <span /> Erro: {errosCount}
          </Badge>
        </div>

        <div className="preview-table">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Turma</th>
                <th>INEP</th>
                <th>Matrícula</th>
                <th>Responsável</th>
                <th>Fone 1</th>
                <th>Fone 2</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((s, i) => (
                <tr key={i}>
                  <td>{s.nome || "—"}</td>
                  <td>{s.turma || "—"}</td>
                  <td>{s.inep || "—"}</td>
                  <td>{s.matricula || "—"}</td>
                  <td>{s.responsavel || "—"}</td>
                  <td>{s.fone1 || "—"}</td>
                  <td>{s.fone2 || "—"}</td>
                  <td>
                    <Badge
                      className={
                        s.status === "OK"
                          ? "status-badge success"
                          : s.status === "ATENCAO"
                          ? "status-badge warning"
                          : "status-badge error"
                      }
                    >
                      <span />
                      {s.status === "ATENCAO" && "ATENÇÃO"}
                      {s.status === "ERRO" && "ERRO"}
                      {s.status === "OK" && "OK"}
                      {s.duplicate && " (duplicado)"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            className="primary-button"
            onClick={onConfirm}
            disabled={errosCount > 0}
          >
            Confirmar e salvar alunos
          </Button>
        </DialogFooter>
      </CardContent>
    </Card>
  );
}
