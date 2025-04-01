// auth cuentas operativas producción
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/AuthCollection.js";
import UserPersonal from "../models/AuthPersonalAccountCollection.js";
import { uploadFile } from "../models/S3Model.js";
import { redis } from "../config/redis.js";

// REGISTER, LOGIN, AND UPDATE CUENTAS OPERATIVAS
export const register = async (req, res) => {
  try {
    const {
      origenDeLaCuenta,
      tipoDeGrupo,
      codificacionDeRoles,
      apodo,
      cuenta,
      password,
      situacionLaboral,
      emailPersonal,
    } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ $or: [{ cuenta }] });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const user = new User({
      origenDeLaCuenta,
      tipoDeGrupo,
      codificacionDeRoles,
      apodo,
      cuenta,
      emailPersonal,
      password: hashedPassword,
      situacionLaboral,
    });

    await user.save();

    // Crear token JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        origenDeLaCuenta: user.origenDeLaCuenta,
        tipoDeGrupo: user.tipoDeGrupo,
        codificacionDeRoles: user.codificacionDeRoles,
        apodo: user.apodo,
        cuenta: user.cuenta,
        emailPersonal: user.emailPersonal,
        situacionLaboral: user.situacionLaboral,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { cuenta, password } = req.body;

    const user = await User.findOne({ cuenta });
    if (!user) {
      return res.status(400).json({ message: "Usuario incorrecto" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    const existingToken = await redis.get(`session:${user._id}`);
    if (existingToken) {
      await redis.del(`session:${user._id}`);
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d", 
    });

    await redis.set(`session:${user._id}`, token, "EX", 86400); 

    res.json({
      token,
      user: {
        id: user._id,
        origenDeLaCuenta: user.origenDeLaCuenta,
        tipoDeGrupo: user.tipoDeGrupo,
        codificacionDeRoles: user.codificacionDeRoles,
        apodo: user.apodo,
        cuenta: user.cuenta,
        email: user.email,
        situacionLaboral: user.situacionLaboral,
        fotoURL: user.fotoURL,
        numeroDeTelefonoMovil: user.numeroDeTelefonoMovil,
        emailPersonal: user.emailPersonal,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params; // Obtener el id del usuario de la URL
    const {
      origenDeLaCuenta,
      tipoDeGrupo,
      codificacionDeRoles,
      apodo,
      situacionLaboral,
      cuenta,
      password, // Nuevo password
      nombrePersonal,
      emailPersonal,
      fotoURL,
      numeroDeTelefonoMovil,
      cuentaAuditor,
      cuentaPersonalAuditor,
      fechaDeAuditoria
    } = req.body;

    // Verificar si el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Si se pasa una nueva contraseña, encriptarla
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Actualizar los demás campos del usuario
    user.origenDeLaCuenta = origenDeLaCuenta || user.origenDeLaCuenta;
    user.tipoDeGrupo = tipoDeGrupo || user.tipoDeGrupo;
    user.codificacionDeRoles = codificacionDeRoles || user.codificacionDeRoles;
    user.apodo = apodo || user.apodo;
    user.situacionLaboral = situacionLaboral || user.situacionLaboral;
    user.cuenta = cuenta || user.cuenta;
    user.nombrePersonal = nombrePersonal || user.nombrePersonal;
    user.emailPersonal = emailPersonal || user.emailPersonal;
    user.fotoURL = fotoURL || user.fotoURL;
    user.numeroDeTelefonoMovil = numeroDeTelefonoMovil || user.numeroDeTelefonoMovil;
    user.cuentaAuditor = cuentaAuditor;
    user.cuentaPersonalAuditor = cuentaPersonalAuditor;
    user.fechaDeAuditoria = fechaDeAuditoria
    // Guardar los cambios en la base de datos
    await user.save();
    // Responder con los datos actualizados del usuario
    res.json({
      message: "Usuario actualizado con éxito",
      user: {
        id: user._id,
        origenDeLaCuenta: user.origenDeLaCuenta,
        tipoDeGrupo: user.tipoDeGrupo,
        codificacionDeRoles: user.codificacionDeRoles,
        apodo: user.apodo,
        situacionLaboral: user.situacionLaboral,
        cuenta: user.cuenta,
        nombrePersonal: user.nombrePersonal,
        emailPersonal: user.emailPersonal,
        fotoURL: user.fotoURL,
        numeroDeTelefonoMovil: user.numeroDeTelefonoMovil,
        cuentaAuditor: user.cuentaAuditor,
        cuentaPersonalAuditor: user.cuentaPersonalAuditor
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REGISTER, LOGIN, AND UPDATE CUENTAS PERSONALES
export const registerPersonal = async (req, res) => {
  try {
    const { email, password, codificacionDeRoles } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await UserPersonal.findOne({ $or: [{ email }] });
    if (userExists) {
      return res.status(400).json({ message: "El usuario ya existe" });
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Crear usuario
    const user = new UserPersonal({
      email,
      password: hashedPassword,
      codificacionDeRoles,
    });
    await user.save();
    // Crear token JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.status(201).json({
      token,
      user: {
        email: user.email,
        codificacionDeRoles,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginPersonal = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await UserPersonal.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Usuario incorrecto" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    const sessionKey = `session:${user._id}`;
    const existingToken = await redis.get(sessionKey);

    if (existingToken) {
      await redis.del(sessionKey);
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    await redis.set(sessionKey, token, "EX", 86400);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        nombreCompleto: user.nombreCompleto,
        dni: user.dni,
        telefono: user.telefono,
        cuenta: user.cuenta,
        codificacionDeRoles: user.codificacionDeRoles,
        fotoURL: user.fotoURL,
        numeroDeTelefonoMovil: user.numeroDeTelefonoMovil,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateUserPersonal = async (req, res) => {
  try {
    const { userId } = req.params; // Obtener el id del usuario de la URL
    const {
      cuenta,
      apodo,
      numeroDeTelefonoMovil,
      dni,
      nombreCompleto,
      codificacionDeRoles,
      email,
      password, // Nuevo password
    } = req.body;

    // Verificar si el usuario existe
    const user = await UserPersonal.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Si se pasa una nueva contraseña, encriptarla
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      // cargar imagen
      const imgApp = await uploadFile(req.file, req.file.originalname);

      if (imgApp?.Location) {
        user.fotoURL = imgApp.Location || user.fotoURL;
      } else {
        res
          .status(500)
          .json({ error: "Error uploading file", details: error.message });
      }
    }

    // Actualizar los demás campos del usuario
    user.cuenta = cuenta || user.cuenta;
    user.apodo = apodo || user.apodo;
    user.numeroDeTelefonoMovil =
      numeroDeTelefonoMovil || user.numeroDeTelefonoMovil;
    user.dni = dni || user.dni;
    user.nombreCompleto = nombreCompleto || user.nombreCompleto;
    user.codificacionDeRoles = codificacionDeRoles || user.codificacionDeRoles;
    user.email = email || user.email;
    user.numeroDeTelefonoMovil =
      numeroDeTelefonoMovil || user.numeroDeTelefonoMovil;

    // Guardar los cambios en la base de datos
    await user.save();

    // Responder con los datos actualizados del usuario
    res.json({
      message: "Usuario actualizado con éxito",
      user: {
        id: userId,
        cuenta: user.cuenta,
        apodo: user.apodo,
        numeroDeTelefonoMovil: user.numeroDeTelefonoMovil,
        dni: user.dni,
        nombreCompleto: user.nombreCompleto,
        codificacionDeRoles: user.codificacionDeRoles,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login with token cuentas operativas y cuentas personales
export const getProfileWithToken = async (req, res) => {
  const token = req.headers.authorization; // Obtener solo el token

  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Obtener el token guardado en Redis
    const storedToken = await redis.get(`session:${decoded.userId}`);

    if (!storedToken || storedToken !== token) {
      return res.status(401).json({ message: "Sesión no válida o ha sido cerrada" });
    }

    // Buscar en User
    let user = await User.findById(decoded.userId);
    if (user) {
      return res.json({
        token,
        user: {
          id: user._id,
          origenDeLaCuenta: user.origenDeLaCuenta,
          tipoDeGrupo: user.tipoDeGrupo,
          codificacionDeRoles: user.codificacionDeRoles,
          apodo: user.apodo,
          cuenta: user.cuenta,
          emailPersonal: user.emailPersonal,
          situacionLaboral: user.situacionLaboral,
          fotoURL: user.fotoURL,
          numeroDeTelefonoMovil: user.numeroDeTelefonoMovil,
        },
      });
    }

    // Buscar en UserPersonal
    let userPersonal = await UserPersonal.findById(decoded.userId);
    if (userPersonal) {
      return res.json({
        token,
        user: {
          id: userPersonal._id,
          email: userPersonal.email,
          nombreCompleto: userPersonal.nombreCompleto,
          dni: userPersonal.dni,
          telefono: userPersonal.telefono,
          cuenta: userPersonal.cuenta,
          codificacionDeRoles: userPersonal.codificacionDeRoles,
          fotoURL: userPersonal.fotoURL,
          numeroDeTelefonoMovil: userPersonal.numeroDeTelefonoMovil,
        },
      });
    }

    return res.status(404).json({ message: "Usuario no encontrado" });
  } catch (error) {
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
};

export const getUsersWithFilters = async (req, res) => {
  try {
    const { nombreCompleto, email, age, status } = req.query;
    const filter = {};

    // Aplicar filtros opcionales si están presentes en `req.query`
    if (nombreCompleto) {
      filter.nombreCompleto = { $regex: nombreCompleto, $options: "i" };
    }
    if (email) {
      filter.email = { $regex: email, $options: "i" };
    }
    if (age) {
      filter.age = parseInt(age);
    }
    if (status) {
      filter.status = status;
    }

    // Configuración de paginación y límites
    const limit = parseInt(req.query.limit) || 1000;
    const page = parseInt(req.query.page) || 1;

    // Consultar MongoDB con filtros, paginación y límite
    const users = await UserPersonal.find(filter)
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    // Obtener el número total de documentos que cumplen con el filtro
    const totalDocuments = await UserPersonal.countDocuments(filter);
    const totalPages = Math.ceil(totalDocuments / limit);

    res.json({
      data: users,
      currentPage: page,
      totalPages,
      totalDocuments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const loginVerificacion = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar si el usuario existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Usuario incorrecto" });
    }

    // Verificar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    // Crear token JWT
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        codificacionDeRoles: user.codificacionDeRoles,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
