# Brief de Design — Visualizador de Horários e Ensalamento (Católica do Tocantins) v2

## O que é o projeto

Um site que mostra os horários de aula e o ensalamento (sala/bloco/campus) de todos os cursos do Centro Universitário Católica do Tocantins. Os dados vêm de uma planilha Excel mantida pela coordenação acadêmica (hospedada no SharePoint da faculdade) — não temos controle sobre o formato dela, ela é baixada e reprocessada automaticamente toda vez que alguém acessa o site. Não existe login nem conta de usuário, e não vai existir por enquanto: o site é público, sem backend com banco de dados.

## Quem usa

Alunos de graduação, majoritariamente pelo celular, muitas vezes checando rápido "onde é minha aula agora" entre um horário e outro, às vezes com internet ruim no campus. Precisa ser rápido de ler, sem fricção, sem exigir cadastro.

## Restrição técnica importante (isso molda o design)

Uma das telas principais ("Meu Horário") funciona assim: o aluno escolhe as matérias dele uma vez, e o site gera um **link pessoal** pra ele. Esse link não salva nada em servidor — a seleção das matérias fica codificada dentro da própria URL. Toda vez que o aluno abre esse link, o site busca a planilha atualizada e mostra a sala/horário mais recentes daquelas matérias. Ou seja: não existe "minha conta", existe "meu link" — o design precisa deixar isso claro e dar confiança de que salvar/favoritar aquele link é o que substitui um login.

## Dados disponíveis por aula (o que pode aparecer num card)

- Curso (ex: "Engenharia de Software")
- Disciplina (ex: "Banco de Dados I")
- Professor
- Dia da semana
- Horário
- Turno (Manhã / Tarde / Noite / Integral)
- Período/semestre do curso
- Turma
- Campus (I ou II)
- Bloco e Sala
- Frequência — a maioria das aulas é semanal, mas algumas são quinzenais (1ª ou 2ª semana)

## Telas para desenhar

### 1. Início — Buscar horários (visão geral, todos os cursos)
A tela pública padrão, sem nenhuma seleção prévia. Tem filtros (Curso, Turno, Dia, Período, **Professor** — importante: um aluno ou coordenador precisa poder filtrar só por um professor pra ver todas as aulas dele na semana e onde ele está dando aula cada dia) e uma busca livre por texto. Abaixo, a lista/grid de aulas que batem com o filtro. Precisa mostrar com destaque "atualizado às HH:MM" pra dar confiança de que os dados são recentes. Esta tela continua acessível a qualquer momento, mesmo pra quem já tem um link pessoal — é a porta de entrada geral.

### 2. Montar Meu Horário (modo seleção)
O aluno usa os mesmos filtros da tela 1 pra encontrar as próprias matérias, mas aqui cada aula tem um botão de "adicionar ao meu horário". Precisa de um indicador sempre visível (barra fixa, principalmente no mobile) mostrando quantas matérias já foram escolhidas, com um botão final "Gerar meu link".

### 3. Meu Horário (modo visualização, depois de gerar o link)
Ao abrir o link pessoal, mostra uma **grade semanal** (Segunda a Sábado) só com as matérias daquele aluno — não é mais lista genérica, é a visão "minha semana". Tem botão pra copiar o link e um botão pra "editar minhas matérias" (volta pro modo seleção). Se alguma matéria que o aluno escolheu não existir mais na planilha atual (foi renomeada/removida), tem que aparecer um aviso claro sobre isso, sem quebrar o resto da grade.

### 4. Calendário Acadêmico
Uma lista de datas importantes do semestre — feriados, provas, início/fim de semestre — agrupada por mês, com os "próximos eventos" destacados no topo. É uma tela de leitura simples, sem interação complexa.

## Tom visual

O protótipo atual usa tema escuro (fundo `slate-950`, gradiente azul→ciano nos títulos, cards com borda lateral azul), Tailwind CSS + shadcn/ui. Pode manter essa linha ou repensar completamente — o que importa é: parecer confiável e "oficial" (não parecer feito por um aluno de última hora), ser limpo o suficiente pra não cansar quem olha várias vezes por dia, e funcionar muito bem no formato mobile primeiro (mas também ficar bom no desktop).

## O que eu preciso que você entregue

- Direção visual das 4 telas acima (mobile e desktop), incluindo os estados vazios (ex: nenhuma aula encontrada, calendário ainda sem eventos cadastrados) e o aviso de "matéria não encontrada mais" na tela 3.
- Paleta de cores e tipografia.
- Os componentes que se repetem: card de aula, badge de turno/tipo de evento do calendário, a barra fixa de seleção (tela 2), a grade semanal (tela 3).

A implementação em código (Next.js/React/Tailwind) eu continuo fazendo depois a partir do que você entregar — você só precisa se preocupar com a direção visual e de interação, não com o código em si.
