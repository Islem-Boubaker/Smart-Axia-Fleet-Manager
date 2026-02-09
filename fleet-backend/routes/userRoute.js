import { Router } from 'express';

const router = Router();


router.get('/', (req, res) => {
    try {
        res.status(200).json({ message: 'Get all users' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get('/:id', (req, res) => {
    try {
        const { id } = req.params;
        res.status(200).json({ message: `Get user ${id}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', (req, res) => {
    try {
        const { name, email } = req.body;
        res.status(201).json({ message: 'User created', data: { name, email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', (req, res) => {
    try {
        const { id } = req.params;
        res.status(200).json({ message: `User ${id} updated` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', (req, res) => {
    try {
        const { id } = req.params;
        res.status(200).json({ message: `User ${id} deleted` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;