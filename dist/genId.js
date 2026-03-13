export default async function generateID() {
    const base = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    const baseArr = base.split("");
    let id = "";
    const length = 7;
    for (let i = 0; i < length; i++) {
        id += baseArr[Math.floor(Math.random() * baseArr.length - 1)];
    }
    return id;
}
//# sourceMappingURL=genId.js.map