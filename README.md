# Relatório SCFV

Aplicação web simples, pensada para uso pelo celular, para gerar o relatório mensal do Serviço de Convivência e Fortalecimento de Vínculos (SCFV).

## O que já faz

- dados fixos da oficina pré-preenchidos;
- modelos para turma 18 a 59 anos e turma 60+;
- cadastro de várias oficinas/datas no mesmo mês;
- ditado por voz quando o navegador permite;
- botão **Organizar com IA** usando Gemini;
- escolha entre texto em tópicos ou texto descritivo;
- materiais usados com seleção simples;
- inclusão opcional de fotos;
- geração do PDF no padrão visual da APIAS, com logo, marca-d'água, rodapé e paginação;
- salvamento automático no próprio aparelho;
- interface responsiva para celular.

## Variáveis da Vercel

Configure estas variáveis no projeto:

- `GEMINI_API_KEY`: chave da API do Gemini;
- `GEMINI_MODEL`: `gemini-3.7-flash`;
- `ACCESS_PIN`: opcional. Se definido, o sistema pede o código somente no primeiro acesso em cada aparelho.

A chave do Gemini fica somente no servidor da Vercel e não é enviada para o navegador.

## Uso mensal

1. abrir o link;
2. escolher mês e turma;
3. escrever ou ditar o que aconteceu em cada oficina;
4. tocar em **Organizar com IA**;
5. conferir o texto;
6. marcar os materiais;
7. adicionar fotos, se desejar;
8. tocar em **Gerar PDF**.
