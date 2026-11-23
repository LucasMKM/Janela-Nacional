class ErroValidacao extends Error {
  constructor(mensagem) { super(mensagem); this.name = 'ErroValidacao'; this.status = 400; }
}
class ErroNaoEncontrado extends Error {
  constructor(mensagem) { super(mensagem); this.name = 'ErroNaoEncontrado'; this.status = 404; }
}
module.exports = { ErroValidacao, ErroNaoEncontrado };
