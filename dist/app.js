"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const test_1 = require("./functions/test");
const app = (0, express_1.default)();
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.get('/', (req, res) => {
    res.render('index', { title: 'index EJS avec express', test: "Voici le test1", auCube: test_1.auCube, auCarre: test_1.auCarre });
});
app.use((req, res) => {
    res.status(404).sendFile("views/erreur.html", { root: __dirname });
});
app.listen(3000, () => {
    console.log('En attente de requêtes au port 3000');
});
