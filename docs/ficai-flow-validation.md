# Validação do fluxo aluno e FICAI

A revisão do fluxo confirma que a seleção de um aluno abre seu registro completo com turma, matrícula, INEP, responsável, telefones e endereço. O mesmo painel apresenta o histórico individual de faltas com data, quantidade de dias, motivo, participação FICAI, observação e status.

A ação **Marcar falta** está disponível diretamente no registro do aluno. O formulário contém data, dias, motivo, observação e a seleção explícita **Participa da ficha FICAI: Sim/Não**. O registro é salvo como RASCUNHO e a tela de envios abre uma etapa de revisão antes da confirmação.

Após a confirmação, a escola envia os rascunhos correspondentes ao período normalizado para `YYYY-MM`. O envio recebe status `ENVIADO`, grava o vínculo `envioId` nas faltas e fica disponível para revisão administrativa.

A composição foi validada para viewport desktop e mobile com tabelas responsivas, histórico em blocos, modais com ações empilháveis e controles nativos navegáveis por teclado. A validação automatizada final passou com TypeScript, build de produção e 19 testes Vitest.
