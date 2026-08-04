# Prompt de Conversão da Planilha

Cole este texto em uma nova conversa com Claude, junto com o arquivo Excel da planilha.

---

Você vai receber uma planilha Excel de ensalamento da Unicatólica (Centro Universitário Católico do Tocantins), em Palmas/TO.

Preciso que você leia essa planilha e gere uma nova planilha com uma única aba, onde cada linha é uma aula, com as seguintes colunas:

**curso | periodo | disciplina | docente | dia | turno | campus | sala | bloco | horario | turma | frequencia**

---

**Como a planilha original funciona:**

Cada aba da planilha é um curso diferente. Dentro de cada aba há uma tabela com as aulas daquele curso. O nome da aba é o nome do curso.

A coluna de período usa células mescladas — quando a célula estiver vazia, repita o último valor preenchido acima.

---

**Informações que a planilha não informa, mas você precisa saber:**

**Turno:** Quase todos os cursos são noturnos. O padrão é sempre "Noite", exceto:
- Se o nome da aba contiver "MATUTINO" → turno é "Manhã"
- Se contiver "VESPERTINO" → turno é "Tarde"
- Se contiver "INTEGRAL" → turno é "Integral"
- Se a própria célula do dia mencionar manhã, tarde ou noite → use esse valor

Aulas de sábado nunca são noturnas. Se não houver indicação de turno, use "Manhã".

**Campus:** A planilha não tem coluna de campus. Determine assim:
- Medicina Veterinária, Zootecnia e Agronomia → "Campus II"
- Todos os outros cursos → "Campus I"

---

**Valores padrão para campos vazios:**
- Docente vazio → "(Sem informação)"
- Sala vazia → "(Sem sala)"
- Bloco vazio → "-"
- Frequência: preencha somente se a célula do dia mencionar "quinzenal" (ex: "Quinzenal (1ª Sem.)")

---

Gere a planilha resultante com uma aba chamada "dados", uma linha por aula, sem linhas em branco. Se alguma aba tiver formato que você não conseguiu ler, me avise no final.
