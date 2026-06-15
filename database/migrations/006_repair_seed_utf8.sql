BEGIN;

UPDATE ministries SET name = 'Missões' WHERE name = 'Miss??es';

UPDATE members SET cell_name = 'Célula Esperança' WHERE cell_name = 'C??lula Esperan??a';
UPDATE members SET cell_name = 'Célula Graça' WHERE cell_name = 'C??lula Gra??a';
UPDATE members SET cell_name = 'Célula Família' WHERE cell_name = 'C??lula Fam??lia';
UPDATE members SET cell_name = 'Célula Jovens' WHERE cell_name = 'C??lula Jovens';
UPDATE members SET cell_name = 'Sem célula' WHERE cell_name = 'Sem c??lula';
UPDATE members SET role = 'Líder' WHERE role = 'L??der';

UPDATE people SET state = 'São Paulo' WHERE state = 'S??o Paulo';
UPDATE people SET full_name = replace(full_name, 'Jo??o', 'João') WHERE full_name LIKE '%Jo??o%';
UPDATE people SET full_name = replace(full_name, 'Tain??', 'Tainá') WHERE full_name LIKE '%Tain??%';
UPDATE people SET full_name = replace(full_name, 'Nat??lia', 'Natália') WHERE full_name LIKE '%Nat??lia%';
UPDATE people SET full_name = replace(full_name, 'Vin??cius', 'Vinícius') WHERE full_name LIKE '%Vin??cius%';
UPDATE people SET full_name = replace(full_name, 'Andr??', 'André') WHERE full_name LIKE '%Andr??%';
UPDATE people SET full_name = replace(full_name, 'Let??cia', 'Letícia') WHERE full_name LIKE '%Let??cia%';

UPDATE visitors SET invited_by = 'Espontâneo' WHERE invited_by = 'Espont??neo';

COMMIT;
