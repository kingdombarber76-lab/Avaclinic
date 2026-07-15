<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Service;
use App\Models\Schedule;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ==========================
        // Tenant
        // ==========================
        $tenant = Tenant::firstOrCreate(
            [
                'slug' => 'ava-clinic-odontologia'
            ],
            [
                'name' => 'AVA Clinic Odontología',
                'phone' => '+595992814554',
                'whatsapp' => '+595992814554',
                'address' => 'J5H6+HRX, Encarnación 070125',
                'city' => 'Encarnación',
                'country' => 'Paraguay',
                'is_active' => true,
            ]
        );

        // ==========================
        // Usuario Administrador
        // ==========================
        $user = User::firstOrCreate(
            [
                'email' => 'admin@avaclinic.com'
            ],
            [
                'tenant_id' => $tenant->id,
                'name' => 'AVA Clinic Odontología',
                'password' => bcrypt('123456'), // Cambiar luego del primer inicio de sesión
                'role' => 'owner',
                'is_active' => true,
            ]
        );

        // ==========================
        // Servicio
        // ==========================

        Service::firstOrCreate(
            [
                'tenant_id' => $tenant->id,
                'name' => 'Consulta Odontológica'
            ],
            [
                'description' => 'Consulta general de odontología',
                'duration_minutes' => 60,
                'price' => , // Modificar según corresponda
                'is_active' => true,
                'sort_order' => 1,
            ]
        );

        // ==========================
        // Horarios
        // día: 0=domingo … 6=sábado
        // ==========================

        $horarios = [
            0 => [],                         // Domingo: cerrado
            1 => [['08:00', '18:00']],       // Lunes
            2 => [['08:00', '18:00']],       // Martes
            3 => [['08:00', '18:00']],       // Miércoles
            4 => [['08:00', '18:00']],       // Jueves
            5 => [['08:00', '18:00']],       // Viernes
            6 => [['09:00', '17:30']],       // Sábado
        ];

        foreach ($horarios as $day => $rangos) {
            foreach ($rangos as [$apertura, $cierre]) {
                Schedule::firstOrCreate(
                    [
                        'tenant_id' => $tenant->id,
                        'user_id' => $user->id,
                        'day_of_week' => $day,
                        'opens_at' => $apertura . ':00',
                    ],
                    [
                        'closes_at' => $cierre . ':00',
                        'is_active' => true,
                    ]
                );
            }
        }

        echo PHP_EOL;
        echo "======================================" . PHP_EOL;
        echo " AVA Clinic Odontología inicializado" . PHP_EOL;
        echo "======================================" . PHP_EOL;
        echo "Tenant ID: {$tenant->id}" . PHP_EOL;
        echo "User (odontólogo) ID: {$user->id}" . PHP_EOL;
        echo "Servicios:" . PHP_EOL;

        foreach (Service::where('tenant_id', $tenant->id)->get(['id', 'name']) as $s) {
            echo "  - {$s->id}: {$s->name}" . PHP_EOL;
        }

        echo "======================================" . PHP_EOL;
    }
}
