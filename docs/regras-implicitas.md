# Regras Implícitas do Ensalamento — Unicatólica

Estas são as regras institucionais que NÃO estão escritas na planilha, mas são necessárias para interpretá-la corretamente.

---

## Turno padrão dos cursos

A grande maioria dos cursos é **noturno**. Quando a planilha não informa o turno, assume-se **Noite**.

Exceções explícitas (identificadas pelo nome da aba):
- Nome contém `MATUTINO` → **Manhã**
- Nome contém `VESPERTINO` → **Tarde**
- Nome contém `INTEGRAL` → **Integral** (cursos de medicina, aulas ao longo do dia)

Quando o turno está na coluna "Dia" (ex: "Terça-manhã", "Quarta noturno"), esse valor sobrescreve o padrão acima.

---

## Sábado nunca é noturno

Aulas de sábado são sempre no turno **Manhã**, salvo se a célula indicar explicitamente tarde ou manhã.  
Não existe aula noturna aos sábados nesta instituição.

---

## Campus

Há dois campi. A planilha não informa o campus em nenhuma coluna — ele é determinado pelo curso:

**Campus II** (área agrária, fora do centro):
- Medicina Veterinária
- Zootecnia
- Agronomia

**Campus I** — todos os demais cursos.

---

## Período (células mescladas)

A coluna de período usa células mescladas: o valor aparece apenas na primeira linha do grupo e as demais ficam vazias. O período vazio deve herdar o último valor preenchido acima (fill-down).
