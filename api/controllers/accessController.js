import User from '../models/AuthCollection.js';
import UserPersonal from '../models/AuthPersonalAccountCollection.js';

// Obtener todos los usuarios
export const getAllUsers = async (req, res) => {
  try {
    const { nombrePersonal, cuenta, tipoDeGrupo, tipoGrupo, situacionLaboral, emailPersonal, limit = 5, page = 1 } = req.query;
    
    const filter = {};

    if (tipoDeGrupo) {
      const palabras = tipoDeGrupo.split(',').map(palabra => new RegExp(palabra.trim(), 'i'));
      filter.tipoDeGrupo = { $in: palabras };
    }
    
    if (tipoGrupo) {
      const palabras = tipoGrupo.split(',').map(palabra => palabra.trim());
      filter.tipoDeGrupo = { $in: palabras };
    }

    if (situacionLaboral) {
      filter.situacionLaboral = { $regex: situacionLaboral, $options: "i" }; // Insensible a mayúsculas
    }

    if (nombrePersonal) {
      filter.nombrePersonal = { $regex: nombrePersonal, $options: "i" }; // Insensible a mayúsculas
    }

    if (cuenta) {
      filter.cuenta = { $regex: cuenta, $options: "i" }; // Insensible a mayúsculas
    }

    if (emailPersonal) {
      filter.emailPersonal = { $regex: emailPersonal, $options: "i" };
    }
    
    // obtener el total de documentos
    const totalDocuments = await User.countDocuments(filter);
        
    // Asegurarse de que limit y page sean números enteros
    const limitInt = parseInt(limit, 10);
    const pageInt = parseInt(page, 10);

    // calcular el total de páginas
    const totalPages = Math.ceil(totalDocuments / limitInt);

    // Consulta a MongoDB con filtro dinámico
    const users = await User.find(filter)
      .limit(limitInt)
      .skip((pageInt - 1) * limitInt);
    
    res.json({
      data: users,
      currentPage: pageInt,
      totalPages,
      totalDocuments,
    }); 
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllPersonalAccounts = async (req, res) => {
  try {
    const { email, nombreCompleto, dni, numeroDeTelefonoMovil, page=1, limit=5 } = req.query;

    const filter = {};
    if (email) {
      filter.email = { $regex: email, $options: "i" };
    }

    if (nombreCompleto) {
      filter.nombreCompleto = { $regex: nombreCompleto, $options: "i" };
    }

    if (dni) {
      filter.dni = { $regex: dni, $options: "i" };
    }

    if (numeroDeTelefonoMovil) {
      filter.numeroDeTelefonoMovil = { $regex: numeroDeTelefonoMovil, $options: "i" };
    }

    const totalDocuments = await UserPersonal.countDocuments(filter);

    const totalPages = Math.ceil(totalDocuments/limit);
    const users = await UserPersonal.find(filter).limit(parseInt(limit)).skip((parseInt(page)-1)*parseInt(limit));
    
    res.json({
      data: users,
      currentPage: parseInt(page),
      totalPages,
      totalDocuments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



