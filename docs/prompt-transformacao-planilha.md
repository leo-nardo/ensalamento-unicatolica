# Prompt: Transformar Planilha de Ensalamento em Base de Dados Normalizada

> Copie e cole este prompt para uma IA (ex: Claude, ChatGPT) junto com o arquivo Excel original da planilha de ensalamento da Unicatólica. A IA vai gerar uma planilha normalizada, pronta para uso como banco de dados.

---

## PROMPT PARA A IA

```
Você vai receber uma planilha Excel de ensalamento de uma universidade (Unicatólica - Palmas/TO).
Essa planilha foi feita para ser lida por humanos que conhecem o contexto institucional.
Seu trabalho é transformá-la em uma tabela plana e normalizada, pronta para uso como banco de dados.

---

### ENTENDENDO A PLANILHA ORIGINAL

A planilha tem VÁRIAS ABAS. Cada aba representa um CURSO.
Dentro de cada aba há uma tabela com as aulas daquele curso.

A tabela dentro de cada aba pode começar em qualquer linha (até a linha 10).
Você deve encontrar a linha de cabeçalho procurando por colunas com esses nomes (ignore maiúsculas/minúsculas e acentos):

| Coluna que você precisa | Como pode aparecer na planilha |
|------------------------|-------------------------------|
| Período                | "período", "periodo"          |
| Disciplina             | "disciplina", "matéria", "materia", "assunto", "estágio", "estagio" |
| Docente                | "docente", "professor", "instrutor" |
| Dia                    | "dia", "semana"               |
| Sala                   | "sala", "local"               |
| Bloco                  | "bloco"                       |
| Horário                | "horário", "horario", "hora"  |
| Turma                  | "turma", "grupo"              |

A linha de cabeçalho é a primeira linha (entre as 10 primeiras) que contenha simultaneamente:
- a coluna "Dia" E
- a coluna "Disciplina" OU a coluna "Docente"

---

### REGRAS DE EXTRAÇÃO E NORMALIZAÇÃO

Para cada linha de dados (abaixo do cabeçalho), extraia os campos abaixo seguindo TODAS as regras:

---

#### 1. CAMPO: `curso`
- Origem: nome da aba
- Transformação: converta para Title Case em português
  - Palavras que DEVEM ficar em minúsculas (exceto se for a primeira palavra): de, da, do, dos, das, e, em, na, no, para, por
  - Exemplos: "DIREITO MATUTINO" → "Direito Matutino" | "SISTEMAS DE INFORMACAO" → "Sistemas de Informacao"

---

#### 2. CAMPO: `periodo`
- Origem: coluna "Período"
- Regra especial (células mescladas): a coluna de período frequentemente tem células mescladas, fazendo com que várias linhas abaixo fiquem vazias. Se a célula estiver vazia, use o ÚLTIMO valor não vazio lido nessa coluna (fill-down).
- Exemplos válidos: "1º", "2º", "3º", "4º", "5º", "6º", "7º", "8º", "9º", "10º"

---

#### 3. CAMPO: `disciplina`
- Origem: coluna "Disciplina"
- Pule a linha se:
  - O valor for vazio
  - O valor for "0"
  - O valor for "null" (texto)
  - O valor for igual a "disciplina" (header repetido)
  - O valor for igual a "período" (header repetido)
- Exceção NPJ: se a aba for sobre NPJ (Núcleo de Prática Jurídica) e não houver coluna de disciplina, use o nome da aba como disciplina.

---

#### 4. CAMPO: `docente`
- Origem: coluna "Docente"
- Se vazio: use o texto `(Sem informação)`

---

#### 5. CAMPO: `dia`
- Origem: coluna "Dia"
- Normalize para um dos valores exatos abaixo (procure o nome dentro do texto da célula):
  - `Segunda`
  - `Terça`
  - `Quarta`
  - `Quinta`
  - `Sexta`
  - `Sábado`
  - `Domingo`
- Se nenhum dia for encontrado no texto, PULE a linha inteira (não gere registro).

---

#### 6. CAMPO: `turno`
- NÃO vem de nenhuma coluna diretamente. É CALCULADO em dois passos:

**Passo 1 - Turno padrão do curso (pelo nome da aba):**
- Se o nome da aba contiver "MATUTINO" ou "DIREITO MATUTINO" → turno padrão = `Manhã`
- Se o nome da aba contiver "VESPERTINO" → turno padrão = `Tarde`
- Se o nome da aba contiver "INTEGRAL" → turno padrão = `Integral`
- Qualquer outro caso → turno padrão = `Noite`

**Passo 2 - Refinamento pelo conteúdo da célula "Dia" (sobrescreve o padrão):**
- Esta regra se aplica SEMPRE quando o turno padrão é `Integral`
- Esta regra se aplica quando o texto da célula "Dia" contiver as palavras "manhã", "tarde" ou "noite"
  - Se contiver "manhã" ou "matutino" → turno = `Manhã`
  - Se contiver "tarde" ou "vespertino" → turno = `Tarde`
  - Se contiver "noite" ou "noturno" → turno = `Noite`

**Regra especial para Sábado:**
- Se o texto da célula "Dia" contiver "sábado" ou "sabado", E não contiver nenhum dos termos de turno acima → turno = `Manhã`

---

#### 7. CAMPO: `frequencia`
- Origem: texto da célula "Dia"
- Se o texto contiver "quinzenal":
  - Valor base: `Quinzenal`
  - Se também contiver "01": valor = `Quinzenal (1ª Sem.)`
  - Se também contiver "02": valor = `Quinzenal (2ª Sem.)`
- Se não contiver "quinzenal": deixe o campo vazio (`""`)

---

#### 8. CAMPO: `campus`
- CALCULADO pelo nome da aba (não vem de nenhuma coluna)
- Se o nome da aba contiver qualquer um dos textos abaixo (case insensitive):
  - "MEDICINA VETERINÁRIA" ou "MEDICINA VETERINARIA"
  - "ZOOTECNIA"
  - "AGRONOMIA"
  → campus = `Campus II`
- Qualquer outro curso → campus = `Campus I`

---

#### 9. CAMPO: `sala`
- Origem: coluna "Sala"
- Se vazio: use o texto `(Sem sala)`

---

#### 10. CAMPO: `bloco`
- Origem: coluna "Bloco"
- Se vazio: use o texto `-`

---

#### 11. CAMPO: `horario`
- Origem: coluna "Horário"
- Use o valor exato como está na planilha (ex: "07:30 - 09:10", "19:00 - 22:30")

---

#### 12. CAMPO: `turma`
- Origem: coluna "Turma"
- Use o valor exato como está (pode ficar vazio se não existir)

---

### FORMATO DE SAÍDA

Gere uma planilha Excel com uma única aba chamada `dados`.
A primeira linha deve ser o cabeçalho com exatamente esses nomes de coluna:

```
curso | periodo | disciplina | docente | dia | turno | frequencia | campus | sala | bloco | horario | turma
```

Cada linha a seguir representa uma aula. Não inclua colunas extras. Não inclua a coluna `id` (ela é gerada pelo sistema).

---

### EXEMPLOS DE TRANSFORMAÇÃO

#### Exemplo 1 - Linha normal:
- Aba: `DIREITO NOTURNO`
- Linha original: `3º | Direito Constitucional | João Silva | Quarta-feira | Sala 12 | B | 19:00-22:00 | A`
- Resultado:
  ```
  curso = "Direito Noturno"
  periodo = "3º"
  disciplina = "Direito Constitucional"
  docente = "João Silva"
  dia = "Quarta"
  turno = "Noite"
  frequencia = ""
  campus = "Campus I"
  sala = "Sala 12"
  bloco = "B"
  horario = "19:00-22:00"
  turma = "A"
  ```

#### Exemplo 2 - Células mescladas de período:
- Aba: `ADMINISTRAÇÃO`
- Linhas originais:
  ```
  1º | Matemática Financeira | Maria Lima | Segunda | Sala 5 | A | 19:00 | T1
     | Gestão de Pessoas     | Ana Souza  | Terça   | Sala 3 | A | 19:00 | T1
     | Marketing             | Pedro Neto | Quinta  | Sala 7 | A | 21:00 | T1
  ```
- Resultado (o período "1º" é propagado para as linhas 2 e 3):
  ```
  Administração | 1º | Matemática Financeira | Maria Lima | Segunda | Noite | | Campus I | Sala 5 | A | 19:00 | T1
  Administração | 1º | Gestão de Pessoas     | Ana Souza  | Terça   | Noite | | Campus I | Sala 3 | A | 19:00 | T1
  Administração | 1º | Marketing             | Pedro Neto | Quinta  | Noite | | Campus I | Sala 7 | A | 21:00 | T1
  ```

#### Exemplo 3 - Turno integral com turno na coluna "Dia":
- Aba: `MEDICINA INTEGRAL`
- Linha original: `5º | Clínica Médica I | Dr. Carlos | Terça-manhã | Sala Lab | C | 07:30 | T2`
- Resultado:
  ```
  dia = "Terça"
  turno = "Manhã"  ← sobrescreve "Integral" porque o texto contém "manhã"
  campus = "Campus I"
  ```

#### Exemplo 4 - Frequência quinzenal:
- Coluna "Dia" contém: `Sexta-feira quinzenal 01`
- Resultado:
  ```
  dia = "Sexta"
  frequencia = "Quinzenal (1ª Sem.)"
  ```

#### Exemplo 5 - Professor sem informação:
- Coluna "Docente" está vazia
- Resultado: `docente = "(Sem informação)"`

---

### VALIDAÇÕES FINAIS

Antes de entregar a planilha gerada:
1. Verifique se todas as linhas têm o campo `dia` preenchido (linhas sem dia devem ter sido puladas)
2. Verifique se nenhuma linha tem `disciplina` vazia, "0" ou "null"
3. Verifique se o campo `turno` está sempre com um dos valores: `Manhã`, `Tarde`, `Noite`, `Integral`
4. Verifique se o campo `campus` está sempre com `Campus I` ou `Campus II`
5. O número total de linhas na planilha de saída deve ser razoável (espera-se centenas de registros)

Se encontrar alguma inconsistência grave (ex: aba com formato completamente diferente), liste as abas problemáticas em um comentário ao final, mas continue processando as demais.
```

---

## COMO USAR

1. Abra Claude, ChatGPT ou outro assistente de IA com capacidade de ler arquivos
2. Anexe o arquivo Excel original da planilha de ensalamento
3. Cole o prompt acima
4. A IA vai gerar uma planilha normalizada em formato Excel ou CSV
5. Essa planilha pode substituir a lógica de extração atual do sistema

---

## ESTRUTURA DE COLUNAS DA PLANILHA RESULTANTE

| Coluna       | Tipo    | Exemplo              | Nunca vazio? |
|-------------|---------|----------------------|--------------|
| `curso`      | texto   | "Direito Noturno"    | ✅ Sim        |
| `periodo`    | texto   | "3º"                 | ✅ Sim        |
| `disciplina` | texto   | "Direito Civil"      | ✅ Sim        |
| `docente`    | texto   | "João Silva"         | ✅ Sim (fallback: "(Sem informação)") |
| `dia`        | texto   | "Segunda"            | ✅ Sim        |
| `turno`      | texto   | "Noite"              | ✅ Sim        |
| `frequencia` | texto   | "Quinzenal (1ª Sem.)"| ❌ Pode vazio |
| `campus`     | texto   | "Campus I"           | ✅ Sim        |
| `sala`       | texto   | "Sala 12"            | ✅ Sim (fallback: "(Sem sala)") |
| `bloco`      | texto   | "B"                  | ✅ Sim (fallback: "-") |
| `horario`    | texto   | "19:00 - 22:30"      | ❌ Pode vazio |
| `turma`      | texto   | "T1"                 | ❌ Pode vazio |

---

## CONTEXTO INSTITUCIONAL (para referência)

- **Instituição:** Unicatólica (Centro Universitário Católico do Tocantins) - Palmas/TO
- **Responsável pela planilha:** Secretaria Acadêmica
- **Campus I:** Cursos da área de humanas, exatas e sociais aplicadas
- **Campus II:** Cursos da área agrária/veterinária (Medicina Veterinária, Zootecnia, Agronomia)
- **Turnos existentes:** Manhã (7:30-12:00), Tarde (13:00-18:00), Noite (19:00-22:30), Integral (cursos de medicina)
- **Cursos noturnos por padrão:** A grande maioria dos cursos (quando o nome da aba não especifica o turno)
- **Dias letivos:** Segunda a Sexta. Sábado ocorre para algumas disciplinas específicas (sempre de manhã, salvo indicação contrária)
