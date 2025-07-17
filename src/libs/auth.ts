import bcrypt from "bcryptjs";
import User from "@/db/mongodb/models/User";
import { jwtVerify, SignJWT } from "jose";
import { NextRequest } from "next/server";
import { LOGIN_DURATION } from "./const";

export type TokenPayload = {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified: boolean;
  phoneNumber?: string;
};

export function hashPassword(password: string): string {
  const saltRounds = 10; // Adjust the salt rounds for desired security vs. performance
  const salt = bcrypt.genSaltSync(saltRounds);
  const hashedPassword = bcrypt.hashSync(password, salt);
  return hashedPassword;
}

export function checkPasswordMatch(password: string, hashedPassword: string): boolean {
  return bcrypt.compareSync(password, hashedPassword);
}


export async function generateToken(user: TokenPayload): Promise<string> {
  const secretKey = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
  return await new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    isVerified: user.isVerified,
    phoneNumber: user.phoneNumber,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(LOGIN_DURATION)
    .sign(secretKey);
}


export const getProfile = async (token: string) => {
  try {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    return {
      id: payload.id as number,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as string,
      isVerified: payload.isVerified as boolean,
      phoneNumber: payload.phoneNumber as string,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export const getAuth = async (req: NextRequest, type = 'cookie') => {
  if (type === 'cookie') {
    const cookies = req.cookies;
    const token = cookies.get('token');
    if (!token) return null;
    return await getProfile(token?.value) as any;
  } else {
    // Auth header (Bearer token)
    const token = req.headers.get('Authorization');
    if (!token) return null;
    return await getProfile(token.split(' ')[1]) as any;
  }
}

export async function register(name: string, email: string, password: string,batchNo:string,phoneNumber:string,latitude:string,longitude:string) {
  if (!name || !email || !password||!phoneNumber||!latitude||!longitude)
    throw Error("Invalid name, email or password,phoneNumber,latitude,longitude.");

  const user = await User.findOne({ email });
  const role=(batchNo==="")?"user":"police"
  if (user)
    throw Error("User already exists.");

  const newUser = new User({
    name,
    email,
    password: hashPassword(password),
    batchNo,
    role,
    phoneNumber,
    latitude,
    longitude
  });

  await newUser.save();
   console.log("User created successfully:", newUser);
  return newUser;
}

export async function login(email: string, password: string) {
  if (!email || !password)
    throw Error("Invalid email or password.");

  const user = await User.findOne({ email });

  if (!user)
    throw Error("Invalid email or password.");
  if (checkPasswordMatch(password, user.password)) {
    const userInfo = {
      id: user.id,
      name: user.name,
      email: user.email,
      isVerified: user.isVerified,
      phoneNumber: user.phoneNumber,
      role: user.role,
    };

    const token = await generateToken(userInfo);
    return { token, user: userInfo };
  } else throw Error("Invalid email or password.");
}

