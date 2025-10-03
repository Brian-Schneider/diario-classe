import {useContext, useEffect, useState} from "react";
import {
  Button,
  Checkbox,
  Modal,
  ModalBody,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow
} from "flowbite-react";
// import {QrReader} from "react-qr-reader";
import {buscar, cadastrar, deletar} from "../../../services/Service.ts";
import {Toast, ToastAlerta} from "../../../utils/ToastAlerta.ts";
import {AuthContext} from "../../../contexts/AuthContext.tsx";
import {Presenca, Turma} from "../../../models";

export default function RegistroPresencaPage() {
  const {usuario, handleLogout, isHydrated} = useContext(AuthContext);
  const token = usuario.token;

  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [qrOpen, setQrOpen] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [turmas, setTurmas] = useState<Turma[]>([]); // lista de turmas do professor
  const [turmaSelecionada, setTurmaSelecionada] = useState<number | null>(null);
  const [dataChamada, setDataChamada] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    if (isHydrated && token) {
      buscar("/turmas", setTurmas, {
        headers: {Authorization: `Bearer ${token}`},
      });
    }
  }, [token, isHydrated]);


  async function buscarPresencas() {
    if (!turmaSelecionada) return;
    try {
      setIsLoading(true);
      await buscar(
        `/presencas/turmas/${turmaSelecionada}?data=${dataChamada}`,
        setPresencas,
        {headers: {Authorization: `Bearer ${token}`}}
      );
    } catch (error: any) {
      if (error.toString().includes("403")) {
        ToastAlerta("O token expirou, favor logar novamente", Toast.Error);
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isHydrated && token) buscarPresencas();
  }, [token, isHydrated]);


  async function salvarTodasPresencas() {
    try {
      await Promise.all(
        presencas.map(presenca => {
          const body = {
            data: dataChamada,
            presente: presenca.presente,
            alunoId: presenca.alunoId,
            turmaId: presenca.turmaId,
            metodoChamada: "MANUAL",
          };

          return cadastrar("/presencas/batch", body, () => {
          }, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
        })
      );

      ToastAlerta("✅ Todas as presenças salvas", Toast.Success);
    } catch (error) {
      console.error("Erro ao salvar presenças", error);
      ToastAlerta("Erro ao salvar presenças", Toast.Error);
    }
  }

  async function salvarPresenca(presenca: Presenca) {
    try {
      if (presenca.presente) {
        // criar ou atualizar presença
        await cadastrar(
          "/presencas",
          {
            data: dataChamada,
            presente: true,
            alunoId: presenca.alunoId,
            turmaId: presenca.turmaId,
            metodoChamada: "MANUAL",
          },
          () => {
          },
          {headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"}}
        );
      } else {
        // deletar presença se existir
        await deletar(
          `/presencas/turma/${presenca.turmaId}/aluno/${presenca.alunoId}?data=${dataChamada}`,
          {headers: {Authorization: `Bearer ${token}`}}
        );
      }

      ToastAlerta(`✅ Presença de ${presenca.alunoNome} atualizada`, Toast.Success);

      // Recarrega lista para refletir alterações
      await buscarPresencas();
    } catch (error) {
      console.error(error);
      ToastAlerta("Erro ao atualizar presença", Toast.Error);
    }
  }

  // Quando ler o QR Code
  const handleScan = async (result: any) => {
    if (result?.text) {
      setScanResult(result.text);
      setQrOpen(false);
      const [alunoId, nome, turmaId] = result.text.split(";");

      await fetch("http://localhost:8080/presencas/presenca/scan", {
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
        body: new URLSearchParams({alunoId, turmaId, metodoChamada: "QR_CODE"}),
      });

      alert(`✅ Presença registrada via QR Code para ${nome}`);
      await buscarPresencas();
    }
  };

  return (
    <div className="p-6 pt-28">

      <h1 className="text-2xl font-bold mb-6">Registro de Presença</h1>

      <div className="flex flex-wrap md:flex-nowrap justify-between items-center mb-6 gap-4">
        {/* Esquerda: selects e botão carregar */}
        <div className="flex flex-wrap gap-4">
          <select
            className="border rounded p-2"
            value={turmaSelecionada ?? ""}
            onChange={(e) => setTurmaSelecionada(Number(e.target.value))}
          >
            <option value="">Selecione a turma</option>
            {turmas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.anoLetivo})
              </option>
            ))}
          </select>

          <input
            type="date"
            className="border rounded p-2"
            value={dataChamada}
            onChange={(e) => setDataChamada(e.target.value)}
          />

          <Button
            // color="success"
            onClick={buscarPresencas}
            disabled={!turmaSelecionada}
            className="w-full md:w-auto"
          >
            Carregar alunos
          </Button>
        </div>

        {/* Direita: botão QR Code */}
        <Button
          // color="success"
          onClick={() => setQrOpen(true)}
          className="w-full md:w-auto"
        >
          📷 Ler QR Code
        </Button>
      </div>


      <Modal show={qrOpen} onClose={() => setQrOpen(false)}>
        <ModalHeader>Ler QR Code</ModalHeader>
        <ModalBody>
          {/*<QrReader*/}
          {/*  constraints={{facingMode: "environment"}}*/}
          {/*  onResult={handleScan}*/}
          {/*  style={{width: "100%"}}*/}
          {/*/>*/}
        </ModalBody>
      </Modal>

      {presencas.length > 0 && (
        <Table className="mt-6">
          <TableHead>
            <TableHeadCell>Aluno</TableHeadCell>
            <TableHeadCell>Presente</TableHeadCell>
            <TableHeadCell>Ações</TableHeadCell>
          </TableHead>
          <TableBody>
            {presencas.map((p) => (
              <TableRow key={p.alunoId}>
                <TableCell>{p.alunoNome}</TableCell>
                <TableCell>
                  <Checkbox
                    checked={p.presente}
                    onChange={(e) => {
                      setPresencas((prev) =>
                        prev.map((x) =>
                          x.alunoId === p.alunoId ? {...x, presente: e.target.checked} : x
                        )
                      );
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button size="xs" color="blue" onClick={() => salvarPresenca(p)}>
                    Salvar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
