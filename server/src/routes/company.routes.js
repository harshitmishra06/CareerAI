import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.middleware.js';
import { validateCreateCompany, validateUpdateCompany } from '../validators/company.validator.js';

const router = Router();

// Recruiter-specific company management
router.post('/', requireAuth, requireRole('recruiter'), validateCreateCompany, CompanyController.create);
router.get('/me', requireAuth, requireRole('recruiter'), CompanyController.getMe);
router.patch('/me', requireAuth, requireRole('recruiter'), validateUpdateCompany, CompanyController.updateMe);

// Public company details retrieval
router.get('/:id', CompanyController.getById);

export default router;
