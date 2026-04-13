
import NextAuth from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";

import bcrypt from "bcryptjs";

import dbConnect from "./lib/db";

import User from "./models/User";



export const { handlers, signIn, signOut, auth } = NextAuth({

    providers: [

        CredentialsProvider({

            name: "Credentials",

            credentials: {

                email: { label: "Email", type: "email" },

                password: { label: "Password", type: "password" }

            },

            async authorize(credentials) {

                if (!credentials?.email || !credentials?.password) return null;



                await dbConnect();


                // Find the user in our MongoDB database

                const user = await User.findOne({ email: credentials.email });

                if (!user) return null;



                // Verify the password

                const isPasswordValid = await bcrypt.compare(

                    credentials.password as string,

                    user.password

                );



                if (!isPasswordValid) return null;



                // Return the user object, specifically including the role for routing

                return {

                    id: user._id.toString(),

                    name: user.name,

                    email: user.email,

                    role: user.role, // 'ADMIN', 'BCBA', or 'RBT'

                };

            }

        })

    ],

    callbacks: {

        // Add the role to the JWT token

        async jwt({ token, user }) {

            if (user) {

                token.role = (user as any).role;

            }

            return token;

        },

        // Make the role available in the client session

        async session({ session, token }) {

            if (token && session.user) {

                (session.user as any).role = token.role;

            }

            return session;

        }

    },

    pages: {

        signIn: "/login", // Custom login page route

    },

    session: {

        strategy: "jwt",

    },

});

