/*
  Warnings:

  - You are about to drop the column `headId` on the `Department` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."SubjectCategory" AS ENUM ('CORE', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "public"."AcademicYearStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."TermStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- DropForeignKey
ALTER TABLE "public"."Department" DROP CONSTRAINT "Department_headId_fkey";

-- DropIndex
DROP INDEX "public"."Department_headId_key";

-- DropIndex
DROP INDEX "public"."Staff_username_key";

-- AlterTable
ALTER TABLE "public"."Department" DROP COLUMN "headId";

-- CreateTable
CREATE TABLE "public"."Class" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "section" TEXT,
    "capacity" INTEGER,
    "classTeacherId" INTEGER,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Section" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "classId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subject" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "category" "public"."SubjectCategory" NOT NULL,
    "creditHours" INTEGER,
    "departmentId" INTEGER,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AcademicYear" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "yearName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "public"."AcademicYearStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Term" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "status" "public"."TermStatus" NOT NULL DEFAULT 'ACTIVE',
    "academicYearId" INTEGER,

    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Curriculum" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "academicYearId" INTEGER NOT NULL,
    "termId" INTEGER NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,

    CONSTRAINT "Curriculum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentApplication" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "otherNames" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "email" TEXT,
    "contactNumber" TEXT,
    "previousSchool" TEXT,
    "intendedClass" TEXT,
    "guardianName" TEXT,
    "guardianContact" TEXT,
    "applicationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "StudentApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Student" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "studentNo" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "otherNames" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "gender" TEXT,
    "address" TEXT,
    "email" TEXT,
    "contactNumber" TEXT,
    "nationality" TEXT,
    "placeOfBirth" TEXT,
    "religion" TEXT,
    "bloodGroup" TEXT,
    "medicalHistory" TEXT,
    "allergies" TEXT,
    "disability" TEXT,
    "previousSchool" TEXT,
    "previousClass" TEXT,
    "transferReason" TEXT,
    "emergencyName" TEXT,
    "emergencyContact" TEXT,
    "emergencyRelation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentGuardian" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "relation" TEXT,
    "contactNumber" TEXT,
    "email" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGuardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentRegistration" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "status" TEXT,
    "schoolId" INTEGER NOT NULL,
    "departmentId" INTEGER,
    "classId" INTEGER,
    "sectionId" INTEGER,
    "academicYearId" INTEGER NOT NULL,
    "termId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "curriculumId" INTEGER NOT NULL,

    CONSTRAINT "StudentRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentCurriculum" (
    "id" SERIAL NOT NULL,
    "studentRegistrationId" INTEGER NOT NULL,
    "curriculumId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentCurriculum_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Class_username_key" ON "public"."Class"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Section_username_key" ON "public"."Section"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_username_key" ON "public"."Subject"("username");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicYear_username_key" ON "public"."AcademicYear"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Term_username_key" ON "public"."Term"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Curriculum_username_key" ON "public"."Curriculum"("username");

-- CreateIndex
CREATE UNIQUE INDEX "StudentApplication_username_key" ON "public"."StudentApplication"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Student_username_key" ON "public"."Student"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentNo_key" ON "public"."Student"("studentNo");

-- CreateIndex
CREATE UNIQUE INDEX "StudentRegistration_username_key" ON "public"."StudentRegistration"("username");

-- AddForeignKey
ALTER TABLE "public"."Class" ADD CONSTRAINT "Class_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "public"."Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Section" ADD CONSTRAINT "Section_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Subject" ADD CONSTRAINT "Subject_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Term" ADD CONSTRAINT "Term_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Curriculum" ADD CONSTRAINT "Curriculum_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Curriculum" ADD CONSTRAINT "Curriculum_termId_fkey" FOREIGN KEY ("termId") REFERENCES "public"."Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Curriculum" ADD CONSTRAINT "Curriculum_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Curriculum" ADD CONSTRAINT "Curriculum_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentGuardian" ADD CONSTRAINT "StudentGuardian_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentRegistration" ADD CONSTRAINT "StudentRegistration_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentRegistration" ADD CONSTRAINT "StudentRegistration_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentRegistration" ADD CONSTRAINT "StudentRegistration_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentRegistration" ADD CONSTRAINT "StudentRegistration_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentRegistration" ADD CONSTRAINT "StudentRegistration_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentRegistration" ADD CONSTRAINT "StudentRegistration_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "public"."AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentRegistration" ADD CONSTRAINT "StudentRegistration_termId_fkey" FOREIGN KEY ("termId") REFERENCES "public"."Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentRegistration" ADD CONSTRAINT "StudentRegistration_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "public"."Curriculum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentCurriculum" ADD CONSTRAINT "StudentCurriculum_studentRegistrationId_fkey" FOREIGN KEY ("studentRegistrationId") REFERENCES "public"."StudentRegistration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentCurriculum" ADD CONSTRAINT "StudentCurriculum_curriculumId_fkey" FOREIGN KEY ("curriculumId") REFERENCES "public"."Curriculum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
