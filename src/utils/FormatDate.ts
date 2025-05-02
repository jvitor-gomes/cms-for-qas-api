export const formatDate = (date: Date): string => {
    const dia = date.getDate().toString().padStart(2, '0');
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const ano = date.getFullYear();
    const hora = date.getHours().toString().padStart(2, '0');
    const minuto = date.getMinutes().toString().padStart(2, '0');
    const segundo = date.getSeconds().toString().padStart(2, '0');
    const milisegundos = date.getMilliseconds().toString().padStart(3, '0');

    return `${dia}-${mes}-${ano} ${hora}:${minuto}:${segundo}.${milisegundos}`;
}